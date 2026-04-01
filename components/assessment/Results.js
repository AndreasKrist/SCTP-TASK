import React from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import Button from '../ui/Button';
import { useRouter } from 'next/router';

// SVG circular progress — radius 45, so circumference ≈ 282.7
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularScore({ score }) {
  const offset = CIRCUMFERENCE * (1 - score / 100);

  const color =
    score >= 90 ? '#16a34a' :   // green
    score >= 80 ? '#2563eb' :   // blue
    score >= 60 ? '#d97706' :   // amber
                  '#dc2626';    // red

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke="#dbeafe"
          strokeWidth="8"
        />
        {/* Fill */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

function SectionBar({ label, score, weight }) {
  const color =
    score >= 80 ? 'bg-green-500' :
    score >= 60 ? 'bg-amber-500' :
                  'bg-red-400';

  const textColor =
    score >= 80 ? 'text-green-700' :
    score >= 60 ? 'text-amber-700' :
                  'text-red-600';

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="text-sm font-medium text-blue-800">{label}</span>
          <span className="text-xs text-blue-400 ml-2">({weight}% weight)</span>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="w-full bg-blue-100 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function Results() {
  const { results, selectedRole, resetAssessment } = useAssessment();
  const router = useRouter();

  const roleNames = {
    networkAdmin: 'Network Administration',
    cybersecurity: 'Cybersecurity',
  };

  const overallMessage =
    results.successRate >= 90 ? 'Excellent! You have a very strong foundation.' :
    results.successRate >= 80 ? 'Great work! You have a solid foundation.' :
    results.successRate >= 60 ? 'Good effort. Focused learning will help you grow.' :
                                'You may benefit from foundational training first.';

  const sectionScores = results.sectionScores || { aptitude: 0, general: 0, roleSpecific: 0 };

  const handleStartOver = () => {
    resetAssessment();
    router.push('/');
  };

  return (
    <div className="max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
      <div className="p-6 sm:p-8 lg:p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-1">Your Assessment Summary</h2>
          <p className="text-sm text-blue-500">
            Based on your responses — {roleNames[selectedRole]}
          </p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6 flex items-center gap-6">
          <CircularScore score={results.successRate} />
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-400 font-semibold mb-1">Overall Score</p>
            <h3 className="text-lg font-semibold text-blue-800 leading-snug mb-2">
              Your preliminary level of understanding in {roleNames[selectedRole]}
            </h3>
            <p className="text-sm text-blue-600">{overallMessage}</p>
          </div>
        </div>

        {/* Section Scores */}
        <div className="bg-white border border-blue-100 rounded-2xl p-6 mb-6 space-y-5">
          <h3 className="text-base font-semibold text-blue-800 mb-1">Performance by Section</h3>

          <SectionBar
            label="Aptitude"
            score={sectionScores.aptitude}
            weight={50}
          />
          <SectionBar
            label="General IT Awareness"
            score={sectionScores.general}
            weight={25}
          />
          <SectionBar
            label={roleNames[selectedRole]}
            score={sectionScores.roleSpecific}
            weight={25}
          />
        </div>

        {/* Footer note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
          <p className="text-blue-700 text-sm text-center">
            Please feel free to contact ITEL to inquire about specific courses that can help you succeed in your chosen career path.
          </p>
        </div>

        {/* Action */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleStartOver} className="px-10 py-3">
            Start Over
          </Button>
        </div>

      </div>
    </div>
  );
}
