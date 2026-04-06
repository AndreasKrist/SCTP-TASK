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
  const [minimized, setMinimized] = useState(false);

  // Start recording once when questions begin (only on first section)
  useEffect(() => {
    if (recordingStarted.current) return;
    if (currentQuestionSet === 'aptitude') {
      recordingStarted.current = true;
      startRecording().then(() => setCameraAllowed(true)).catch(() => setCameraAllowed(false));
    }
  }, [currentQuestionSet, startRecording]);

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

        // Stop recording and upload in background, then save assessment
        stopRecording().then(async (blob) => {
          let videoUrl = null;
          if (blob) {
            try {
              videoUrl = await uploadRecording(blob, biodata.fullName);
            } catch (uploadErr) {
              console.error('Video upload error:', uploadErr);
            }
          }
          saveAssessment({
            biodata,
            selectedRole,
            results: calculatedResults,
            sessionQuestions,
            answers,
            durationSeconds,
            shuffledOptionsMap,
            videoUrl,
          }).catch(err => console.error('Firebase save error:', err));
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
            {!allAnswered() && (
              <span className="text-xs sm:text-sm text-blue-600 text-center mb-2">
                Please answer all questions to continue
              </span>
            )}
            <Button
              onClick={handleNext}
              disabled={!allAnswered() || isSaving}
              className={`w-full sm:w-auto px-8 py-3 min-h-[48px] mb-2 ${allAnswered() && !isSaving ? 'shadow-lg shadow-blue-500/20' : ''}`}
              id="continue-button"
            >
              {isSaving ? 'Saving...' : 'Continue'}
            </Button>
            <p className="text-xs text-blue-600 text-center">
              {isSaving
                ? '📤 Processing...'
                : !allAnswered()
                ? '👆 Answer all questions above first'
                : "👆 Click 'Continue' to move to the next section"}
            </p>
          </div>
        </div>
      </div>

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
