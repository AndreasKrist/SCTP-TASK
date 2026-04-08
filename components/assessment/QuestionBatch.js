import React, { useState, useEffect, useRef } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import Button from '../ui/Button';
import ProgressBar from './ProgressBar';
import { useRouter } from 'next/router';
import { saveAssessment } from '../../lib/saveAssessment';
import { useRecorder } from '../../hooks/useRecorder';
import { uploadRecording } from '../../lib/uploadRecording';

const OPTION_LABELS = ['a', 'b', 'c', 'd'];

export default function QuestionBatch() {
  const {
    getCurrentBatch,
    recordBatchAnswers,
    nextStage,
    prevStage,
    answers,
    currentQuestionSet,
    getBatchProgress,
    currentBatch,
    selectedRole,
    goBackToRoleSelection,
    resetAssessment,
    biodata,
    calculateResults,
    sessionQuestions,
    assessmentStartTime,
    shuffledOptionsMap,
  } = useAssessment();

  const questions = getCurrentBatch();
  const progress = getBatchProgress();
  const [batchAnswers, setBatchAnswers] = useState({});
  const [showCategoryConfirm, setShowCategoryConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { startRecording, stopRecording, videoRef, isRecording, cameraError } = useRecorder();
  const recordingStarted = useRef(false);
  const [cameraAllowed, setCameraAllowed] = useState(null); // null=unknown, true, false
  const cameraAllowedRef = useRef(null); // ref copy so tab lock can read current value
  const [minimized, setMinimized] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false); // true = browser-level blocked (can't re-prompt)

  // Tab lock
  const [violations, setViolations] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const MAX_VIOLATIONS = 3;
  const lastViolationRef = useRef(0);

  // Mobile detection (for different camera instructions)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
  }, []);

  // Keep ref in sync so tab lock can read cameraAllowed without stale closure
  useEffect(() => { cameraAllowedRef.current = cameraAllowed; }, [cameraAllowed]);

  // Start recording once when questions begin (only on first section)
  useEffect(() => {
    if (recordingStarted.current) return;
    if (currentQuestionSet === 'aptitude') {
      recordingStarted.current = true;
      startRecording()
        .then(() => setCameraAllowed(true))
        .catch((err) => {
          // NotAllowedError = user blocked → show lock icon instructions immediately
          if (err?.name === 'NotAllowedError') setCameraBlocked(true);
          setCameraAllowed(false);
        });
    }
  }, [currentQuestionSet, startRecording]);

  // Tab lock — detect leaving tab/app
  useEffect(() => {
    const recordViolation = () => {
      // Don't count violations while camera permission is still pending
      if (cameraAllowedRef.current === null) return;
      const now = Date.now();
      if (now - lastViolationRef.current < 1500) return; // debounce to avoid double-counting
      lastViolationRef.current = now;
      setViolations(prev => {
        const next = prev + 1;
        if (next >= MAX_VIOLATIONS) {
          setTerminated(true);
        } else {
          setShowTabWarning(true);
        }
        return next;
      });
    };

    const handleVisibilityChange = () => { if (document.hidden) recordViolation(); };
    const handleBlur = () => recordViolation();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleRetryCamera = async () => {
    setCameraBlocked(false);
    recordingStarted.current = false;
    setCameraAllowed(null);

    recordingStarted.current = true;
    try {
      await startRecording();
      setCameraAllowed(true);
    } catch (err) {
      // NotAllowedError = browser/user blocked the camera → show lock icon instructions
      // Other errors (NotFoundError, NotReadableError) = no camera / hardware issue
      if (err?.name === 'NotAllowedError') setCameraBlocked(true);
      setCameraAllowed(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Center Q1 so Q1→Q2 scroll distance matches Q2→Q3
    setTimeout(() => {
      if (questions.length > 0) {
        const el = document.getElementById(`question-${questions[0].id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }, [currentQuestionSet]);

  // Merge stored answers with local batch answers
  const getCurrentAnswers = () => {
    const stored = answers[currentQuestionSet] || {};
    const currentAnswers = {};
    questions.forEach(q => {
      if (stored[q.id] !== undefined) currentAnswers[q.id] = stored[q.id];
    });
    return { ...currentAnswers, ...batchAnswers };
  };

  const handleAnswer = (questionId, optionKey) => {
    setBatchAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    recordBatchAnswers({ [questionId]: optionKey });

    // Auto-scroll to next unanswered question
    setTimeout(() => {
      const currentIndex = questions.findIndex(q => q.id === questionId);
      const nextIndex = currentIndex + 1;
      if (nextIndex < questions.length) {
        const el = document.getElementById(`question-${questions[nextIndex].id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const btn = document.getElementById('continue-button');
        if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 200);
  };

  const isFinalBatch = () => currentQuestionSet === 'roleSpecific';

  const handleNext = async () => {
    const allAnswers = getCurrentAnswers();
    const unanswered = questions.filter(q => allAnswers[q.id] === undefined);

    if (unanswered.length > 0) {
      const el = document.getElementById(`question-${unanswered[0].id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    recordBatchAnswers(allAnswers);

    if (isFinalBatch()) {
      setIsSaving(true);
      try {
        const calculatedResults = calculateResults();

        const durationSeconds = assessmentStartTime
          ? Math.round((Date.now() - assessmentStartTime) / 1000)
          : null;

        // Stop recording first, upload, then save — all in sequence before navigating
        const blob = await stopRecording();
        let videoUrl = null;
        if (blob) {
          try {
            videoUrl = await uploadRecording(blob, biodata.fullName);
          } catch (uploadErr) {
            console.error('Video upload error:', uploadErr);
          }
        }

        await saveAssessment({
          biodata,
          selectedRole,
          results: calculatedResults,
          sessionQuestions,
          answers,
          durationSeconds,
          shuffledOptionsMap,
          videoUrl,
          tabViolations: violations,
        });

        setIsSaving(false);
        nextStage();
      } catch (err) {
        console.error('Error on final batch:', err);
        setIsSaving(false);
        nextStage();
      }
    } else {
      setBatchAnswers({});
      nextStage();
    }
  };

  const allAnswered = () => {
    const all = getCurrentAnswers();
    return questions.every(q => all[q.id] !== undefined);
  };

  const getBatchTitle = () => {
    if (currentQuestionSet === 'aptitude') return `Section 1 — General Aptitude`;
    if (currentQuestionSet === 'general') return `Section 2 — General IT Skills`;
    const roleNames = { networkAdmin: 'SCTP Network Administration', cybersecurity: 'SCTP Cyber Security' };
    return `Section 3 — ${roleNames[selectedRole]}`;
  };

  const handleCategoryChange = () => {
    setShowCategoryConfirm(false);
    goBackToRoleSelection();
  };

  const handleStartOver = () => {
    resetAssessment();
    router.push('/');
  };

  return (
    <div className="max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100 relative">
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Start Over */}
        <div className="flex justify-center mb-4">
          <Button variant="outline" onClick={handleStartOver} className="px-6 py-2 text-sm">
            🔄 Start Over
          </Button>
        </div>

        <ProgressBar current={progress.current} total={progress.total} className="mb-4 sm:mb-6" />

        {/* Change Category */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <button
              onClick={() => setShowCategoryConfirm(!showCategoryConfirm)}
              className="flex items-center px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="hidden sm:inline">Change Category</span>
              <span className="sm:hidden">Change</span>
            </button>

            {showCategoryConfirm && (
              <div className="absolute left-1/2 transform -translate-x-1/2 top-12 bg-white rounded-lg shadow-lg border border-blue-200 p-4 w-72 sm:w-80 z-10">
                <h4 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">Change Course Category?</h4>
                <p className="text-xs sm:text-sm text-blue-600 mb-4">
                  This will reset your current progress and take you back to choose a different category.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCategoryConfirm(false)}
                    className="px-3 py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCategoryChange}
                    className="px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Change Category
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-blue-800 mb-2">
            {getBatchTitle()}
          </h2>
          <p className="text-sm sm:text-base text-blue-600">
            Answer all questions below, then click Continue
          </p>
        </div>

        {/* Question instruction - HIDDEN - Uncomment to show */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-700 text-center text-sm">
            📋 For each question, select the best answer (A, B, C, or D). After answering all questions, click Continue.
          </p>
        </div> */}

        <div className="space-y-6 mb-6 sm:mb-8">
          {questions.map((question, index) => {
            const allAnswers = getCurrentAnswers();
            const currentAnswer = allAnswers[question.id];

            return (
              <div
                key={question.id}
                id={`question-${question.id}`}
                className="border border-blue-100 rounded-xl p-4 sm:p-6 bg-blue-50/30"
              >
                <h3 className="text-base sm:text-lg font-medium text-blue-800 mb-4 leading-relaxed">
                  {index + 1}. {question.text}
                </h3>

                <div className="space-y-2">
                  {(shuffledOptionsMap[question.id] || OPTION_LABELS).map((originalKey, displayIndex) => {
                    const option = question.options[originalKey];
                    const displayLabel = OPTION_LABELS[displayIndex].toUpperCase();
                    const isSelected = currentAnswer === originalKey;
                    return (
                      <button
                        key={originalKey}
                        onClick={() => handleAnswer(question.id, originalKey)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border transition-all duration-150 min-h-[48px]
                          ${isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-400'
                          }`}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5
                          ${isSelected ? 'border-white text-white' : 'border-blue-400 text-blue-600'}`}>
                          {displayLabel}
                        </span>
                        <span className="text-sm sm:text-base leading-snug">{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-blue-100 space-y-4 sm:space-y-0 sm:gap-4">
          <div className="w-full sm:flex-1 text-center">
            <Button
              variant="secondary"
              onClick={prevStage}
              className="w-full sm:w-auto px-8 py-3 min-h-[48px] mb-2"
              disabled={isSaving}
            >
              Back
            </Button>
            <p className="text-xs text-blue-600">👆 Click "Back" to go to the previous section</p>
          </div>

          <div className="w-full sm:flex-1 flex flex-col items-center">
            {cameraAllowed === null && currentQuestionSet === 'aptitude' && (
              <span className="text-xs sm:text-sm text-amber-600 text-center mb-2">
                ⏳ Waiting for camera permission...
              </span>
            )}
            {!allAnswered() && cameraAllowed !== null && (
              <span className="text-xs sm:text-sm text-blue-600 text-center mb-2">
                Please answer all questions to continue
              </span>
            )}
            <Button
              onClick={handleNext}
              disabled={!allAnswered() || isSaving || cameraAllowed === null}
              className={`w-full sm:w-auto px-8 py-3 min-h-[48px] mb-2 ${allAnswered() && !isSaving && cameraAllowed !== null ? 'shadow-lg shadow-blue-500/20' : ''}`}
              id="continue-button"
            >
              {isSaving ? 'Saving...' : 'Continue'}
            </Button>
            <p className="text-xs text-blue-600 text-center">
              {isSaving
                ? '📤 Processing...'
                : cameraAllowed === null && currentQuestionSet === 'aptitude'
                ? '📷 Please allow camera access to continue'
                : !allAnswered()
                ? '👆 Answer all questions above first'
                : "👆 Click 'Continue' to move to the next section"}
            </p>
          </div>
        </div>
      </div>

      {/* Camera blocked overlay */}
      {cameraAllowed === false && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center px-8 py-10 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Camera Access Required</h3>

            {cameraBlocked ? (
              <>
                <p className="text-gray-500 text-sm mb-3">
                  Camera access has been <strong>blocked</strong>. Your browser won&apos;t ask again — you must enable it manually:
                </p>
                {isMobile ? (
                  <div className="text-left text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-5">
                    <p className="font-semibold text-gray-700 mb-2">📱 On your phone:</p>
                    <ol className="space-y-1.5 pl-1">
                      <li>1. Tap the <strong>lock</strong> or <strong>ⓘ</strong> icon near the URL (on iOS Safari, tap <strong>aA</strong>)</li>
                      <li>2. Open <strong>Website Settings</strong> or <strong>Permissions</strong></li>
                      <li>3. Change <strong>Camera</strong> to <strong>Allow</strong></li>
                      <li>4. Tap <strong>Reload Page</strong> below</li>
                    </ol>
                  </div>
                ) : (
                  <div className="text-left text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-5">
                    <p className="font-semibold text-gray-700 mb-2">💻 On your computer:</p>
                    <ol className="space-y-1 pl-1">
                      <li>1. Click the <strong>🔒 lock icon</strong> on the left of the address bar</li>
                      <li>2. Find <strong>Camera</strong> in the permissions list</li>
                      <li>3. Change it to <strong>Allow</strong></li>
                      <li>4. Click <strong>Reload Page</strong> below</li>
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm mb-6">
                This assessment requires camera access to proceed. Please allow camera permission when prompted and try again. If you don&apos;t have a camera, you cannot take this assessment.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {cameraBlocked ? (
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              ) : (
                <button
                  onClick={handleRetryCamera}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Retry Camera
                </button>
              )}
              <button
                onClick={handleStartOver}
                className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab warning modal */}
      {showTabWarning && !terminated && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {violations === MAX_VIOLATIONS - 1 ? '⚠️ Final Warning!' : '⚠️ Warning!'}
            </h3>
            <p className="text-gray-500 text-sm mb-1">
              You left the assessment. This has been recorded.
            </p>
            <p className="text-xs font-medium mb-5 text-red-500">
              Violation {violations} of {MAX_VIOLATIONS} — {MAX_VIOLATIONS - violations} more and your assessment will be terminated.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              I Understand, Continue
            </button>
          </div>
        </div>
      )}

      {/* Assessment terminated overlay */}
      {terminated && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-600 mb-2">Assessment Terminated</h3>
            <p className="text-gray-500 text-sm mb-6">
              You left the assessment too many times. Your session has been terminated. Please start over and stay on this page during the assessment.
            </p>
            <button
              onClick={handleStartOver}
              className="w-full px-6 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Camera preview — fixed bottom-right */}
      {cameraAllowed !== false && (
        <div className="fixed bottom-4 right-4 z-50">
          {minimized ? (
            <button
              onClick={() => setMinimized(false)}
              className="flex items-center gap-2 bg-blue-600 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Camera On
            </button>
          ) : (
            <div className="bg-white rounded-xl shadow-xl border border-blue-200 overflow-hidden w-40 sm:w-48">
              <div className="flex items-center justify-between px-2 py-1 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-1.5">
                  {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  <span className="text-xs text-blue-600 font-medium">
                    {isRecording ? 'Recording' : cameraError ? 'No Camera' : 'Starting...'}
                  </span>
                </div>
                <button
                  onClick={() => setMinimized(true)}
                  className="text-blue-400 hover:text-blue-600 text-xs px-1"
                  title="Minimize"
                >
                  —
                </button>
              </div>
              {cameraError ? (
                <div className="h-24 flex items-center justify-center bg-gray-100">
                  <p className="text-xs text-gray-400 text-center px-2">Camera not available</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-24 sm:h-28 object-cover bg-gray-900"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
