import { jsPDF } from 'jspdf';

const OPTION_LABELS = ['a', 'b', 'c', 'd'];

// Colors
const BLUE = [37, 99, 235];
const DARK = [30, 58, 138];
const GRAY = [100, 116, 139];
const GREEN = [22, 163, 74];
const AMBER = [217, 119, 6];
const RED = [220, 38, 38];
const LIGHT_BLUE = [219, 234, 254];
const WHITE = [255, 255, 255];

function getScoreColor(points, bestPoints) {
  if (points >= bestPoints) return GREEN;
  if (points >= 50) return AMBER;
  return RED;
}

export function generateReportPdf(user, allQuestionsMap) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPage = (needed = 30) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header ──
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TIRA Assessment Report', margin, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Tech Industry Readiness Assessor — ITEL', margin, 23);
  const dateStr = user.timestamp?.toDate
    ? user.timestamp.toDate().toLocaleString()
    : new Date(user.timestamp).toLocaleString();
  doc.text(dateStr, pageWidth - margin, 23, { align: 'right' });

  y = 45;

  // ── User Info ──
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('User Information', margin, y);
  y += 7;

  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);

  const info = [
    ['Name', user.fullName],
    ['Email', user.email],
    ['Phone', user.phone || 'N/A'],
    ['Age Group', user.ageGroup || 'N/A'],
    ['Consultant', user.consultant || 'N/A'],
  ];

  const col1X = margin + 4;
  const col2X = margin + contentWidth / 2 + 4;

  info.forEach((row, i) => {
    const x = i < 3 ? col1X : col2X;
    const rowY = i < 3 ? y + i * 9 : y + (i - 3) * 9;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(`${row[0]}:`, x, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(row[1] || 'N/A', x + 25, rowY);
  });

  y += 38;

  // ── Scores ──
  checkPage(50);
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Assessment Scores', margin, y);
  y += 7;

  // Overall score box
  const scoreColor = user.successRate >= 80 ? GREEN : user.successRate >= 60 ? AMBER : RED;
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(`Role: ${user.roleName}`, margin + 4, y + 7);
  doc.text('Overall Score:', margin + 4, y + 14);
  doc.setTextColor(...scoreColor);
  doc.setFontSize(14);
  doc.text(`${user.successRate}%`, margin + 38, y + 14);

  // Duration
  if (user.durationSeconds) {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    const mins = Math.floor(user.durationSeconds / 60);
    const secs = user.durationSeconds % 60;
    const durStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    doc.text(`Duration: ${durStr}`, pageWidth - margin - 4, y + 7, { align: 'right' });
  }

  y += 22;

  // Section bars
  if (user.sectionScores) {
    const sections = [
      { label: 'Aptitude (50%)', score: user.sectionScores.aptitude },
      { label: 'General IT (25%)', score: user.sectionScores.general },
      { label: 'Role-Specific (25%)', score: user.sectionScores.roleSpecific },
    ];

    sections.forEach(({ label, score }) => {
      const barColor = score >= 80 ? GREEN : score >= 60 ? AMBER : RED;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.text(label, margin + 4, y + 3);
      doc.setTextColor(...barColor);
      doc.text(`${score}%`, pageWidth - margin - 4, y + 3, { align: 'right' });

      // Bar background
      const barY = y + 5;
      const barW = contentWidth - 8;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(margin + 4, barY, barW, 3, 1, 1, 'F');
      // Bar fill
      doc.setFillColor(...barColor);
      doc.roundedRect(margin + 4, barY, barW * (score / 100), 3, 1, 1, 'F');

      y += 12;
    });
  }

  // ── Strengths & Weaknesses ──
  checkPage(30);
  y += 3;

  const halfW = (contentWidth - 4) / 2;

  // Strengths
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('Strengths', margin, y);
  doc.setTextColor(...AMBER);
  doc.text('Areas for Improvement', margin + halfW + 4, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const strengths = user.strengths || [];
  const weaknesses = user.weaknesses || [];
  const maxRows = Math.max(strengths.length, weaknesses.length, 1);

  for (let i = 0; i < maxRows; i++) {
    if (strengths[i]) {
      doc.setTextColor(...DARK);
      doc.text(`• ${strengths[i].replace(/([A-Z])/g, ' $1').trim()}`, margin + 2, y);
    }
    if (weaknesses[i]) {
      doc.setTextColor(...DARK);
      doc.text(`• ${weaknesses[i].replace(/([A-Z])/g, ' $1').trim()}`, margin + halfW + 6, y);
    }
    y += 5;
  }

  if (strengths.length === 0) {
    doc.setTextColor(...GRAY);
    doc.text('None identified', margin + 2, y - 5);
  }
  if (weaknesses.length === 0) {
    doc.setTextColor(...GRAY);
    doc.text('None identified', margin + halfW + 6, y - 5 * maxRows);
  }

  // ── Recommendations ──
  if (user.recommendations?.length > 0) {
    checkPage(20);
    y += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Recommended Courses', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    user.recommendations.forEach(course => {
      checkPage(6);
      doc.setTextColor(...GRAY);
      doc.text(`• ${course}`, margin + 2, y);
      y += 5;
    });
  }

  // ── Answer Review ──
  if (user.answers && user.questionIds) {
    const answerSections = [
      { key: 'aptitude', label: 'Aptitude' },
      { key: 'general', label: 'General IT' },
      { key: 'roleSpecific', label: user.roleName || 'Role-Specific' },
    ];

    answerSections.forEach(({ key, label }) => {
      const qIds = user.questionIds[key] || [];
      const sectionAnswers = user.answers[key] || {};
      if (qIds.length === 0) return;

      checkPage(20);
      y += 6;
      doc.setFillColor(...BLUE);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} — Answer Review`, margin + 4, y + 5.5);
      y += 13;

      qIds.forEach((qId, idx) => {
        const q = allQuestionsMap[qId];
        if (!q) return;

        const userAnswer = sectionAnswers[qId];
        const bestKey = OPTION_LABELS.reduce((best, k) =>
          q.options[k].points > q.options[best].points ? k : best
        , 'a');
        const userPoints = userAnswer && q.options[userAnswer] ? q.options[userAnswer].points : 0;
        const bestPoints = q.options[bestKey].points;

        // Question needs: header (6) + 4 options (5 each) + score (5) + gap (3) = ~34
        checkPage(38);

        // Question text
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        const qLines = doc.splitTextToSize(`${idx + 1}. ${q.text}`, contentWidth - 4);
        doc.text(qLines, margin + 2, y);
        y += qLines.length * 4 + 2;

        // Options
        OPTION_LABELS.forEach(k => {
          checkPage(7);
          const opt = q.options[k];
          const isUser = k === userAnswer;
          const isBest = k === bestKey;

          // Background
          if (isBest && isUser) {
            doc.setFillColor(220, 252, 231); // green-50
          } else if (isBest) {
            doc.setFillColor(240, 253, 244); // green-50 lighter
          } else if (isUser) {
            doc.setFillColor(userPoints >= 50 ? 255 : 254, userPoints >= 50 ? 251 : 226, userPoints >= 50 ? 235 : 226); // amber/red-50
          } else {
            doc.setFillColor(248, 250, 252);
          }
          doc.roundedRect(margin + 2, y - 3, contentWidth - 4, 6, 1, 1, 'F');

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          const labelColor = isUser || isBest ? (isBest ? GREEN : getScoreColor(userPoints, bestPoints)) : GRAY;
          doc.setTextColor(...labelColor);
          doc.text(`${k.toUpperCase()}.`, margin + 4, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          const optText = doc.splitTextToSize(opt.text, contentWidth - 45);
          doc.text(optText, margin + 10, y);

          // Points + labels
          doc.setTextColor(...GRAY);
          doc.text(`${opt.points}pts`, pageWidth - margin - 22, y);
          if (isUser) {
            doc.setTextColor(...BLUE);
            doc.text('You', pageWidth - margin - 10, y);
          }
          if (isBest) {
            doc.setTextColor(...GREEN);
            doc.text('Best', pageWidth - margin - (isUser ? 2 : 10), y);
          }

          y += Math.max(optText.length * 3.5, 5) + 1;
        });

        // Score line
        const sColor = getScoreColor(userPoints, bestPoints);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...sColor);
        const scoreText = userPoints >= bestPoints
          ? `${userPoints}/${bestPoints} pts — Best answer!`
          : `${userPoints}/${bestPoints} pts`;
        doc.text(scoreText, margin + 4, y);
        y += 7;
      });
    });
  }

  // ── Footer on each page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(
      `TIRA Assessment Report — ${user.fullName} — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Save
  const safeName = (user.fullName || 'user').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`TIRA_Report_${safeName}.pdf`);
}
