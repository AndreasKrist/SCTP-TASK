import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { aptitudeQuestions, generalQuestions, roleQuestions } from '../data/questions';
import { generateReportPdf } from '../lib/generateReportPdf';

const OPTION_LABELS = ['a', 'b', 'c', 'd'];

// Build a lookup map: questionId → question object
const allQuestionsMap = {};
[...aptitudeQuestions, ...generalQuestions, ...roleQuestions.networkAdmin, ...roleQuestions.cybersecurity].forEach(q => {
  allQuestionsMap[q.id] = q;
});

export default function Admin() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openAnswerSection, setOpenAnswerSection] = useState(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch assessments when logged in
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'assessments'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (err) {
        console.error('Error fetching assessments:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setLoginError('Invalid email or password');
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUsers([]);
    setSelectedUser(null);
  };

  // handleExport HIDDEN - Uncomment and re-add Export Data button to use
  // const handleExport = () => { ... };

  const handleVideoDownload = (url, fullName) => {
    const safeName = (fullName || 'user').replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = `/api/download-video?url=${encodeURIComponent(url)}`;
    a.download = `Recording_${safeName}.webm`;
    a.click();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Firestore Timestamp has toDate(), plain Date string needs new Date()
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Auth loading
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-blue-600 text-lg">Loading...</p>
        </div>
      </Layout>
    );
  }

  // Login screen
  if (!user) {
    return (
      <Layout>
        <Head>
          <title>Admin Login | TIRA</title>
          <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        </Head>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-blue-100 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-blue-800 mb-6 text-center">Admin Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-blue-800"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-blue-800"
                  placeholder="Enter password"
                />
              </div>
              {loginError && (
                <p className="text-red-600 text-sm text-center">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loggingIn ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // Admin dashboard (authenticated)
  return (
    <Layout>
      <Head>
        <title>Admin | TIRA</title>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Assessment Results</h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Log Out
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-blue-600">Loading assessments...</p>
              </div>
            ) : selectedUser ? (
              <div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    variant="secondary"
                    onClick={() => { setSelectedUser(null); setOpenAnswerSection(null); }}
                    className="w-full sm:w-auto"
                  >
                    &larr; Back to List
                  </Button>
                  <button
                    onClick={() => generateReportPdf(selectedUser, allQuestionsMap)}
                    className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF Report
                  </button>
                </div>

                {/* Video Recording */}
                {selectedUser.videoUrl && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg sm:text-xl font-semibold text-blue-800">Session Recording</h2>
                      <button
                        onClick={() => handleVideoDownload(selectedUser.videoUrl, selectedUser.fullName)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Video
                      </button>
                    </div>
                    <div className="bg-gray-900 rounded-xl overflow-hidden">
                      <video
                        src={selectedUser.videoUrl}
                        controls
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-800">User Information</h2>
                  <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Name:</span>
                      <span className="text-blue-700">{selectedUser.fullName}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Email:</span>
                      <span className="text-blue-700 break-all">{selectedUser.email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Phone:</span>
                      <span className="text-blue-700">{selectedUser.phone}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Age Group:</span>
                      <span className="text-blue-700">{selectedUser.ageGroup}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Consultant:</span>
                      <span className="text-blue-700">{selectedUser.consultant}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Date:</span>
                      <span className="text-blue-700">{formatDate(selectedUser.timestamp)}</span>
                    </div>
                    {selectedUser.durationSeconds && (
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-blue-800 w-full sm:w-24">Duration:</span>
                        <span className="text-blue-700">{formatDuration(selectedUser.durationSeconds)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-800">Assessment Results</h2>
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Role:</span>
                      <span className="text-blue-700">{selectedUser.roleName}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                      <span className="font-medium text-blue-800 w-full sm:w-24">Overall:</span>
                      <span className={`font-bold text-lg ${
                        selectedUser.successRate >= 90 ? 'text-green-600' :
                        selectedUser.successRate >= 75 ? 'text-blue-600' :
                        selectedUser.successRate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedUser.successRate}%
                      </span>
                    </div>
                    {selectedUser.sectionScores && (
                      <div className="space-y-1 mt-3 pt-3 border-t border-blue-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Aptitude (50%)</span>
                          <span className="font-medium text-blue-800">{selectedUser.sectionScores.aptitude}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">General IT (25%)</span>
                          <span className="font-medium text-blue-800">{selectedUser.sectionScores.general}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Role-Specific (25%)</span>
                          <span className="font-medium text-blue-800">{selectedUser.sectionScores.roleSpecific}%</span>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Answer Review */}
                  {selectedUser.answers && selectedUser.questionIds && (
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-800">Answer Review</h2>
                      <div className="space-y-3">
                        {[
                          { key: 'aptitude', label: 'Aptitude' },
                          { key: 'general', label: 'General IT' },
                          { key: 'roleSpecific', label: selectedUser.roleName || 'Role-Specific' },
                        ].map(({ key, label }) => {
                          const qIds = selectedUser.questionIds[key] || [];
                          const sectionAnswers = selectedUser.answers[key] || {};
                          if (qIds.length === 0) return null;

                          return (
                            <div key={key} className="border border-blue-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setOpenAnswerSection(prev => prev === key ? null : key)}
                                className="w-full flex justify-between items-center px-5 py-4 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                              >
                                <span className="font-medium text-blue-800">{label}</span>
                                <svg
                                  className={`w-5 h-5 text-blue-500 transition-transform duration-200 ${openAnswerSection === key ? 'rotate-180' : ''}`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {openAnswerSection === key && (
                                <div className="p-4 space-y-4">
                                  {qIds.map((qId, idx) => {
                                    const q = allQuestionsMap[qId];
                                    if (!q) return (
                                      <div key={qId} className="text-sm text-blue-400 italic">Question {qId} not found</div>
                                    );

                                    const userAnswer = sectionAnswers[qId];
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
                                      <div key={qId} className="rounded-lg border border-blue-100 p-4">
                                        <p className="text-sm font-medium text-blue-800 mb-3">
                                          {idx + 1}. {q.text}
                                        </p>
                                        <div className="space-y-1.5">
                                          {(selectedUser.shuffledOptionsMap?.[qId] || OPTION_LABELS).map((originalKey, displayIndex) => {
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
                                                  {isUser && <span className="text-xs font-medium text-blue-600">User</span>}
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
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : users.length > 0 ? (
              <div>
                <div className="mb-6">
                  <p className="text-blue-600 text-base sm:text-lg font-medium">{users.length} assessment(s) found</p>
                </div>

                {/* Desktop Table */}
                <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
                  <div className="hidden md:block">
                    <table className="w-full table-fixed">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="w-[18%] px-3 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Name</th>
                          <th className="w-[22%] px-3 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Email</th>
                          <th className="w-[16%] px-3 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Role</th>
                          <th className="w-[8%] px-3 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Score</th>
                          <th className="w-[10%] px-3 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Duration</th>
                          <th className="w-[10%] px-3 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Date</th>
                          <th className="w-[16%] px-3 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-blue-100">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-blue-50 transition-colors duration-200">
                            <td className="px-3 py-3 text-sm text-blue-800 font-medium truncate">{u.fullName}</td>
                            <td className="px-3 py-3 text-sm text-blue-700 truncate">{u.email}</td>
                            <td className="px-3 py-3 text-sm text-blue-700 truncate">{u.roleName || 'N/A'}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className={`font-bold text-sm ${
                                u.successRate >= 90 ? 'text-green-600' :
                                u.successRate >= 75 ? 'text-blue-600' :
                                u.successRate >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {u.successRate}%
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-700">
                              {u.durationSeconds ? formatDuration(u.durationSeconds) : '—'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-700">
                              {formatDateShort(u.timestamp)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => generateReportPdf(u, allQuestionsMap)}
                                  title="Download PDF"
                                  className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-medium px-2 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden">
                    {users.map((u) => (
                      <div key={u.id} className="border-b border-blue-100 p-4 last:border-b-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-blue-800 truncate">{u.fullName}</h3>
                            <p className="text-sm text-blue-600 truncate">{u.email}</p>
                          </div>
                          <span className={`ml-2 font-bold text-lg ${
                            u.successRate >= 90 ? 'text-green-600' :
                            u.successRate >= 75 ? 'text-blue-600' :
                            u.successRate >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {u.successRate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-blue-700">
                          <div>
                            <span className="block">{u.roleName || 'N/A'}</span>
                            <span className="text-xs text-blue-500">{formatDateShort(u.timestamp)}</span>
                          </div>
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-3 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors font-medium min-h-[40px]"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-blue-50 rounded-lg">
                <p className="text-blue-600 text-base sm:text-lg">No assessments found.</p>
                <p className="mt-2 text-xs sm:text-sm text-blue-500">
                  Results will appear here after users complete their assessments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
