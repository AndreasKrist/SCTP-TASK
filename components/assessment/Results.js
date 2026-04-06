import React, { useState } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import Button from '../ui/Button';
import { useRouter } from 'next/router';

// SVG circular progress — radius 45, so circumference ≈ 282.7
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularScore({ score }) {
  const offset = CIRCUMFERENCE * (1 - score / 100);

  const color =
    score >= 70 ? '#16a34a' :   // green — Excellent
    score >= 60 ? '#2563eb' :   // blue — Proficient
    score >= 50 ? '#d97706' :   // amber — Pass
                  '#dc2626';    // red — Fail

  return (
    <div className="relative w-48 h-48 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#dbeafe" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

function SectionBar({ label, score }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 70 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-blue-800">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="w-full bg-blue-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

const OPTION_LABELS = ['a', 'b', 'c', 'd'];

function AnswerReviewPanel({ sessionQuestions, answers, selectedRole, shuffledOptionsMap, onClose }) {
  const [activeSection, setActiveSection] = useState('aptitude');

  const roleLabel = selectedRole === 'networkAdmin' ? 'Network' : 'Cybersecurity';

  const sections = [
    { key: 'aptitude', label: 'Aptitude', questions: sessionQuestions.aptitude, answers: answers.aptitude },
    { key: 'general', label: 'General IT', questions: sessionQuestions.general, answers: answers.general },
    { key: 'roleSpecific', label: roleLabel, questions: sessionQuestions.roleSpecific, answers: answers.roleSpecific },
  ];

  const activeData = sections.find(s => s.key === activeSection);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden flex flex-col h-fit max-h-[85vh]">
      {/* Header */}
      <div className="p-5 border-b border-blue-100 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-bold text-blue-800">Review Answers</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-blue-100 flex-shrink-0">
        {sections.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(prev => prev === key ? null : key)}
            className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
              activeSection === key
                ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600'
                : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="overflow-y-auto flex-1 p-4">
        {!activeData ? (
          <div className="text-center py-12 text-blue-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Select a section above to review your answers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeData.questions.map((q, idx) => {
              const userAnswer = activeData.answers[q.id];
              const bestKey = OPTION_LABELS.reduce((best, k) =>
                q.options[k].points > q.options[best].points ? k : best
              , 'a');
              const userPoints = userAnswer && q.options[userAnswer] ? q.options[userAnswer].points : 0;
              const bestPoints = q.options[bestKey].points;

              const scoreColor =
                userPoints >= bestPoints ? 'text-green-600' :
                userPoints >= 50 ? 'text-amber-600' :
                'text-red-500';

              return (
                <div key={q.id} className="rounded-lg border border-blue-100 p-4">
                  <p className="text-sm font-medium text-blue-800 mb-3">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="space-y-1.5">
                    {(shuffledOptionsMap[q.id] || OPTION_LABELS).map((originalKey, displayIndex) => {
                      const displayLabel = OPTION_LABELS[displayIndex].toUpperCase();
                      const opt = q.options[originalKey];
                      const isUser = originalKey === userAnswer;
                      const isBest = originalKey === bestKey;

                      let bg = 'bg-white border-blue-100';
                      if (isBest && isUser) bg = 'bg-green-50 border-green-300';
                      else if (isBest) bg = 'bg-green-50 border-green-200';
                      else if (isUser) bg = userPoints >= 50 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300';

                      return (
                        <div key={originalKey} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${bg}`}>
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                            isBest ? 'border-green-500 text-green-600' :
                            isUser ? (userPoints >= 50 ? 'border-amber-400 text-amber-500' : 'border-red-400 text-red-500') :
                            'border-blue-300 text-blue-500'
                          }`}>
                            {displayLabel}
                          </span>
                          <span className="flex-1 text-blue-800">{opt.text}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-blue-400">{opt.points}pts</span>
                            {isUser && <span className="text-xs font-medium text-blue-600">You</span>}
                            {isBest && <span className="text-xs font-medium text-green-600">Best</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs font-medium ${scoreColor}`}>
                      {userPoints}/{bestPoints} pts
                      {userPoints >= bestPoints && ' — Best answer!'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Results() {
  const { results, selectedRole, resetAssessment, sessionQuestions, answers, shuffledOptionsMap } = useAssessment();
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);

  const roleNames = {
    networkAdmin: 'SCTP Network Administration',
    cybersecurity: 'SCTP Cyber Security',
  };

  const grade =
    results.successRate >= 70 ? 'Excellent' :
    results.successRate >= 60 ? 'Proficient' :
    results.successRate >= 50 ? 'Pass' :
                                'Fail';

  const gradeColor =
    results.successRate >= 70 ? 'text-green-600 border-green-300 bg-green-50' :
    results.successRate >= 60 ? 'text-blue-600 border-blue-300 bg-blue-50' :
    results.successRate >= 50 ? 'text-amber-600 border-amber-300 bg-amber-50' :
                                'text-red-600 border-red-300 bg-red-50';

  const overallMessage =
    results.successRate >= 70 ? 'You have a very strong foundation.' :
    results.successRate >= 60 ? 'You have a solid foundation.' :
    results.successRate >= 50 ? 'Focused learning will help you grow.' :
                                'Keep studying and try again.';

  const sectionScores = results.sectionScores || { aptitude: 0, general: 0, roleSpecific: 0 };

  const handleStartOver = () => {
    resetAssessment();
    router.push('/');
  };

  return (
    <div className={`flex gap-6 items-start justify-center w-full transition-all duration-300 ${showReview ? 'max-w-7xl' : 'max-w-3xl'} mx-auto`}>
      {/* Left — Summary Card */}
      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100 transition-all duration-300 ${showReview ? 'w-full lg:w-5/12 lg:flex-shrink-0' : 'w-full'}`}>
        <div className="p-6 sm:p-8 lg:p-10">

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-1">Your Assessment Summary</h2>
          </div>

          {/* Overall Score Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6 flex flex-col items-center text-center gap-4">
            <h3 className="text-lg font-semibold text-blue-800 leading-snug">
              Tech Industry Readiness of {roleNames[selectedRole]}
            </h3>
            <p className="text-xs uppercase tracking-wide text-blue-400 font-semibold -mt-2">Overall Score</p>
            <CircularScore score={results.successRate} />
            <div>
              <div className="flex justify-center mb-2">
                <span className={`text-sm font-bold px-4 py-1 rounded-full border ${gradeColor}`}>
                  {grade}
                </span>
              </div>
              {overallMessage && <p className="text-sm text-blue-600">{overallMessage}</p>}
            </div>
          </div>

          {/* Performance by Section */}
          <div className="bg-white border border-blue-100 rounded-2xl p-6 mb-6 space-y-5">
            <h3 className="text-base font-semibold text-blue-800 mb-1">Performance by Section</h3>
            <SectionBar label="Aptitude" score={sectionScores.aptitude} />
            <SectionBar label="General IT Awareness" score={sectionScores.general} />
            <SectionBar label={roleNames[selectedRole]} score={sectionScores.roleSpecific} />
          </div>

          {/* Footer note - HIDDEN - Uncomment to show */}
          {/* <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
            <p className="text-blue-700 text-sm text-center">
              Please feel free to contact ITEL to inquire about specific courses that can help you succeed in your chosen career path.
            </p>
          </div> */}

          {/* Review Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowReview(!showReview)}
              className={`w-full flex justify-between items-center px-6 py-4 rounded-xl font-medium transition-colors ${
                showReview
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <span>{showReview ? 'Close Answer Review' : 'Review Your Answers'}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showReview ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile: show review inline below on small screens */}
          {showReview && (
            <div className="lg:hidden mb-6">
              <AnswerReviewPanel
                sessionQuestions={sessionQuestions}
                answers={answers}
                selectedRole={selectedRole}
                shuffledOptionsMap={shuffledOptionsMap}
                onClose={() => setShowReview(false)}
              />
            </div>
          )}

          {/* Action */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleStartOver} className="px-10 py-3">
              Start Over
            </Button>
          </div>
        </div>
      </div>

      {/* Right — Answer Review Panel (desktop only) */}
      {showReview && (
        <div className="hidden lg:block w-7/12 sticky top-6">
          <AnswerReviewPanel
            sessionQuestions={sessionQuestions}
            answers={answers}
            selectedRole={selectedRole}
            shuffledOptionsMap={shuffledOptionsMap}
            onClose={() => setShowReview(false)}
          />
        </div>
      )}
    </div>
  );
}
