import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function saveAssessment({ biodata, selectedRole, results, sessionQuestions, answers, durationSeconds }) {
  const roleNames = { networkAdmin: 'Network Administration', cybersecurity: 'Cybersecurity' };

  const data = {
    // Biodata
    fullName: biodata.fullName,
    email: biodata.email,
    phone: biodata.phone || 'Not provided',
    ageGroup: biodata.ageGroup || 'Not provided',
    consultant: biodata.consultant || 'Not provided',

    // Assessment meta
    role: selectedRole,
    roleName: roleNames[selectedRole],
    timestamp: serverTimestamp(),
    durationSeconds: durationSeconds || null,

    // Scores
    successRate: results.successRate,
    sectionScores: results.sectionScores,

    // Which questions were shown
    questionIds: {
      aptitude: sessionQuestions.aptitude.map(q => q.id),
      general: sessionQuestions.general.map(q => q.id),
      roleSpecific: sessionQuestions.roleSpecific.map(q => q.id),
    },

    // Answers
    answers: {
      aptitude: answers.aptitude,
      general: answers.general,
      roleSpecific: answers.roleSpecific,
    },

    // Extra results data
    strengths: results.strengths,
    weaknesses: results.weaknesses,
    recommendations: results.recommendations.map(r =>
      typeof r === 'string' ? r : r.courseName
    ),
  };

  const docRef = await addDoc(collection(db, 'assessments'), data);
  return docRef.id;
}
