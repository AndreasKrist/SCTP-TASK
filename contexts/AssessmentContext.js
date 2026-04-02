import React, { createContext, useContext, useState } from 'react';
import { aptitudeQuestions, generalQuestions, roleQuestions, courseCatalog } from '../data/questions';

const AssessmentContext = createContext();

export function useAssessment() {
  return useContext(AssessmentContext);
}

// Fisher-Yates shuffle, returns `count` random items from `pool`
function pickRandom(pool, count = 10) {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// Generate shuffled option order for each question
function buildShuffledOptionsMap(questions) {
  const map = {};
  questions.forEach(q => {
    const keys = ['a', 'b', 'c', 'd'];
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    map[q.id] = keys;
  });
  return map;
}

export function AssessmentProvider({ children }) {
  const [biodata, setBiodata] = useState({
    fullName: '',
    email: '',
    phone: '',
    ageGroup: '',
    consultant: '',
  });

  const [selectedRole, setSelectedRole] = useState(null);

  // Stages: welcome → biodata → roleSelection → aptitudeQuestions → generalQuestions → roleQuestions → results
  const [stage, setStage] = useState('welcome');

  // 0 or 1 — each section has 2 batches of 5 questions
  const [currentBatch, setCurrentBatch] = useState(0);

  // Which section is active
  const [currentQuestionSet, setCurrentQuestionSet] = useState('aptitude');

  // Randomly selected questions for this session (set when role is chosen)
  const [sessionQuestions, setSessionQuestions] = useState({
    aptitude: [],
    general: [],
    roleSpecific: [],
  });

  // Answers stored as { [questionId]: 'a' | 'b' | 'c' | 'd' }
  const [answers, setAnswers] = useState({
    aptitude: {},
    general: {},
    roleSpecific: {},
  });

  const [results, setResults] = useState({
    successRate: 0,
    sectionScores: { aptitude: 0, general: 0, roleSpecific: 0 },
    recommendations: [],
    strengths: [],
    weaknesses: [],
  });

  // Shuffled option display order per question — { [questionId]: ['c','a','d','b'] }
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState({});

  // Timer: tracks when questions start
  const [assessmentStartTime, setAssessmentStartTime] = useState(null);

  const updateBiodata = (data) => {
    setBiodata(prev => ({ ...prev, ...data }));
  };

  const selectRole = (role) => {
    setSelectedRole(role);
  };

  // Initialize random question sets for this session
  const initializeSessionQuestions = (role) => {
    const aptitude = pickRandom(aptitudeQuestions, 10);
    const general = pickRandom(generalQuestions, 10);
    const roleSpecific = pickRandom(roleQuestions[role], 10);
    setSessionQuestions({ aptitude, general, roleSpecific });
    setShuffledOptionsMap(buildShuffledOptionsMap([...aptitude, ...general, ...roleSpecific]));
  };

  const startAssessment = () => {
    resetAssessment();
    setStage('biodata');
  };

  // Get all 10 questions for the current section
  const getCurrentBatch = () => {
    if (currentQuestionSet === 'aptitude') return sessionQuestions.aptitude;
    if (currentQuestionSet === 'general') return sessionQuestions.general;
    return sessionQuestions.roleSpecific;
  };

  // Record answers for the current batch
  const recordBatchAnswers = (batchAnswers) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionSet]: {
        ...prev[currentQuestionSet],
        ...batchAnswers,
      },
    }));
  };

  const nextStage = () => {
    switch (stage) {
      case 'welcome':
        setStage('biodata');
        break;
      case 'biodata':
        setStage('roleSelection');
        break;
      case 'roleSelection':
        // Role has been chosen — initialize random questions then proceed
        initializeSessionQuestions(selectedRole);
        setAssessmentStartTime(Date.now());
        setStage('aptitudeQuestions');
        setCurrentQuestionSet('aptitude');
        setCurrentBatch(0);
        break;
      case 'aptitudeQuestions':
        setStage('generalQuestions');
        setCurrentQuestionSet('general');
        break;
      case 'generalQuestions':
        setStage('roleQuestions');
        setCurrentQuestionSet('roleSpecific');
        break;
      case 'roleQuestions':
        calculateResults();
        setStage('results');
        break;
      default:
        break;
    }
  };

  const prevStage = () => {
    switch (stage) {
      case 'biodata':
        setStage('welcome');
        break;
      case 'roleSelection':
        setStage('biodata');
        break;
      case 'aptitudeQuestions':
        setStage('roleSelection');
        break;
      case 'generalQuestions':
        setStage('aptitudeQuestions');
        setCurrentQuestionSet('aptitude');
        break;
      case 'roleQuestions':
        setStage('generalQuestions');
        setCurrentQuestionSet('general');
        break;
      default:
        break;
    }
  };

  // ─────────────────────────────────────────────
  // SCORING
  // Section weights: Aptitude 50%, General IT 25%, Specific IT 25%
  // Each question max = 100 pts, 10 questions per section → section max = 1000 pts
  // Section score = earned / 1000 (0–1)
  // ─────────────────────────────────────────────
  const calculateResults = () => {
    const computeSectionScore = (sectionAnswers, sectionQuestions) => {
      let earned = 0;
      sectionQuestions.forEach(q => {
        const chosen = sectionAnswers[q.id];
        if (chosen && q.options[chosen]) {
          earned += q.options[chosen].points;
        }
      });
      const maxPossible = sectionQuestions.length * 100;
      return maxPossible > 0 ? earned / maxPossible : 0;
    };

    const aptitudeScore = computeSectionScore(answers.aptitude, sessionQuestions.aptitude);
    const generalScore = computeSectionScore(answers.general, sessionQuestions.general);
    const roleScore = computeSectionScore(answers.roleSpecific, sessionQuestions.roleSpecific);

    const weightedScore = (aptitudeScore * 0.5) + (generalScore * 0.25) + (roleScore * 0.25);
    const finalSuccessRate = Math.round(weightedScore * 100);

    // Category analysis — avg score per category
    const categoryStats = {};

    const processSection = (sectionAnswers, sectionQuestions) => {
      sectionQuestions.forEach(q => {
        const cat = q.category;
        const chosen = sectionAnswers[q.id];
        const earned = chosen && q.options[chosen] ? q.options[chosen].points : 0;

        if (!categoryStats[cat]) {
          categoryStats[cat] = { totalEarned: 0, totalMax: 0 };
        }
        categoryStats[cat].totalEarned += earned;
        categoryStats[cat].totalMax += 100;
      });
    };

    processSection(answers.aptitude, sessionQuestions.aptitude);
    processSection(answers.general, sessionQuestions.general);
    processSection(answers.roleSpecific, sessionQuestions.roleSpecific);

    const strengths = [];
    const weaknesses = [];

    Object.entries(categoryStats).forEach(([cat, stats]) => {
      const pct = stats.totalMax > 0 ? stats.totalEarned / stats.totalMax : 0;
      if (pct >= 0.8) strengths.push(cat);
      else if (pct <= 0.4) weaknesses.push(cat);
    });

    // Recommendations: questions where earned points <= 50
    const recommendations = [];

    const collectRecommendations = (sectionAnswers, sectionQuestions, isRoleSpecific = false) => {
      sectionQuestions.forEach(q => {
        const chosen = sectionAnswers[q.id];
        const earned = chosen && q.options[chosen] ? q.options[chosen].points : 0;
        if (earned <= 50) {
          recommendations.push({
            questionId: q.id,
            questionText: q.text,
            courseName: q.courseRecommendation,
            category: q.category,
            isRoleSpecific,
            earnedPoints: earned,
            courseDetails: courseCatalog[q.courseRecommendation] || null,
          });
        }
      });
    };

    collectRecommendations(answers.aptitude, sessionQuestions.aptitude, false);
    collectRecommendations(answers.general, sessionQuestions.general, false);
    collectRecommendations(answers.roleSpecific, sessionQuestions.roleSpecific, true);

    // Sort: role-specific first, then by lowest score
    recommendations.sort((a, b) => {
      if (a.isRoleSpecific && !b.isRoleSpecific) return -1;
      if (!a.isRoleSpecific && b.isRoleSpecific) return 1;
      return a.earnedPoints - b.earnedPoints;
    });

    const calculatedResults = {
      successRate: finalSuccessRate,
      sectionScores: {
        aptitude: Math.round(aptitudeScore * 100),
        general: Math.round(generalScore * 100),
        roleSpecific: Math.round(roleScore * 100),
      },
      recommendations: recommendations.slice(0, 5),
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
    };

    setResults(calculatedResults);
    return calculatedResults;
  };

  const resetAssessment = () => {
    setBiodata({ fullName: '', email: '', phone: '', ageGroup: '', consultant: '' });
    setSelectedRole(null);
    setStage('welcome');
    setCurrentBatch(0);
    setCurrentQuestionSet('aptitude');
    setSessionQuestions({ aptitude: [], general: [], roleSpecific: [] });
    setAnswers({ aptitude: {}, general: {}, roleSpecific: {} });
    setResults({ successRate: 0, sectionScores: { aptitude: 0, general: 0, roleSpecific: 0 }, recommendations: [], strengths: [], weaknesses: [] });
    setShuffledOptionsMap({});
    setAssessmentStartTime(null);
  };

  const switchRole = (newRole) => {
    setSelectedRole(newRole);
    initializeSessionQuestions(newRole);
    setAnswers({ aptitude: {}, general: {}, roleSpecific: {} });
    setAssessmentStartTime(Date.now());
    setStage('aptitudeQuestions');
    setCurrentQuestionSet('aptitude');
    setCurrentBatch(0);
  };

  const goBackToRoleSelection = () => {
    setAnswers({ aptitude: {}, general: {}, roleSpecific: {} });
    setStage('roleSelection');
    setCurrentQuestionSet('aptitude');
    setCurrentBatch(0);
  };

  // Progress: 3 total sections (aptitude, general, role)
  const getBatchProgress = () => {
    const stageIndex = {
      aptitudeQuestions: 1,
      generalQuestions: 2,
      roleQuestions: 3,
    };
    const current = stageIndex[stage] ?? 1;
    const total = 3;
    return {
      current,
      total,
      percentage: Math.round((current / total) * 100),
    };
  };

  const getRoleName = () => {
    const roleNames = { networkAdmin: 'Network', cybersecurity: 'Cybersecurity' };
    return roleNames[selectedRole] || '';
  };

  const value = {
    biodata,
    updateBiodata,
    selectedRole,
    selectRole,
    stage,
    currentBatch,
    currentQuestionSet,
    answers,
    results,
    sessionQuestions,
    nextStage,
    prevStage,
    recordBatchAnswers,
    resetAssessment,
    startAssessment,
    switchRole,
    goBackToRoleSelection,
    getCurrentBatch,
    getBatchProgress,
    getRoleName,
    calculateResults,
    assessmentStartTime,
    shuffledOptionsMap,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}
