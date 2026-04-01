import React, { useState, useEffect } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import Button from '../ui/Button';
import ProgressBar from './ProgressBar';
import { useRouter } from 'next/router';
import { saveUserData } from '../../lib/saveUserData';
import { saveToGoogleSheet } from '../../lib/googleSheets';

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
  } = useAssessment();

  const questions = getCurrentBatch();
  const progress = getBatchProgress();
  const [batchAnswers, setBatchAnswers] = useState({});
  const [showCategoryConfirm, setShowCategoryConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentBatch, currentQuestionSet]);

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

  const isFinalBatch = () => currentQuestionSet === 'roleSpecific' && currentBatch === 1;

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
      setTimeout(() => {
        try {
          const calculatedResults = calculateResults();

          setTimeout(async () => {
            try {
              const roleNames = { networkAdmin: 'Network Administrator', cybersecurity: 'Cybersecurity' };
              const resultsForSaving = {
                role: selectedRole,
                roleName: roleNames[selectedRole],
                successRate: calculatedResults.successRate,
                strengths: calculatedResults.strengths,
                weaknesses: calculatedResults.weaknesses,
                recommendations: calculatedResults.recommendations.map(r =>
                  typeof r === 'string' ? r : r.courseName
                ),
              };
              await saveUserData(biodata, resultsForSaving);
              await saveToGoogleSheet({ ...biodata, results: resultsForSaving });
            } catch (err) {
              console.error('Background save error:', err);
            }
          }, 100);

          setTimeout(() => {
            setIsSaving(false);
            nextStage();
          }, 300);
        } catch (err) {
          console.error('Error on final batch:', err);
          setIsSaving(false);
          nextStage();
        }
      }, 200);
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
    const part = currentBatch === 0 ? 'Part 1' : 'Part 2';
    if (currentQuestionSet === 'aptitude') return `Aptitude — ${part}`;
    if (currentQuestionSet === 'general') return `General IT Skills — ${part}`;
    const roleNames = { networkAdmin: 'Network Administration', cybersecurity: 'Cybersecurity' };
    return `${roleNames[selectedRole]} — ${part}`;
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
    <div className="max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-700 text-center text-sm">
            📋 For each question, select the best answer (A, B, C, or D). After answering all questions, click Continue.
          </p>
        </div>

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
                  {OPTION_LABELS.map(key => {
                    const option = question.options[key];
                    const isSelected = currentAnswer === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(question.id, key)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border transition-all duration-150 min-h-[48px]
                          ${isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-400'
                          }`}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5
                          ${isSelected ? 'border-white text-white' : 'border-blue-400 text-blue-600'}`}>
                          {key.toUpperCase()}
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
    </div>
  );
}
