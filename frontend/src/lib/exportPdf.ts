import jsPDF from 'jspdf';

type ExportData = {
  fileName: string;

  atsResult?: {
    overallScore: number;
    keywordScore: number;
    sectionScore: number;
    formattingScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  };

  errors?: {
    totalIssues: number;
    grammarErrors: {
      error_text: string;
      suggestions?: string[];
    }[];
    unprofessionalIssues: {
      error_text: string;
      suggestions?: string[];
    }[];
  };

  roleMatches?: {
    role: string;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
  }[];

  roleEval?: {
    role: string;
    overallScore: number;
    sectionScores: {
      name: string;
      score: number;
      found: boolean;
    }[];
    matchedSkills: string[];
    missingSkills: string[];
  };
};

export function exportResultsToPdf(data: ExportData) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;



  const checkPage = (space = 10) => {
    if (y + space > 270) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionHeader = (title: string) => {
    checkPage(20);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text(title, margin, y);
    y += 6;

    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  const writeText = (text: string, color = [60, 60, 60]) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  };

  const writeBulletList = (items: string[], color: number[]) => {
    doc.setTextColor(...color);

    items.forEach((item) => {
      checkPage(6);
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
      doc.text(lines, margin + 5, y);
      y += lines.length * 5;
    });

    y += 3;
  };

  const drawProgressBar = (
    label: string,
    value: number
  ) => {
    checkPage(12);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(label, margin, y);

    doc.text(`${value}%`, pageWidth - margin - 10, y);
    y += 3;

    // Background
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, contentWidth, 5, 'F');

    // Color
    const color =
      value >= 70 ? [34, 197, 94] :
      value >= 40 ? [234, 179, 8] :
      [239, 68, 68];

    doc.setFillColor(...color);
    doc.rect(margin, y, (value / 100) * contentWidth, 5, 'F');

    y += 8;
  };

  // ---------- HEADER ----------

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ResumeIQ Report', margin, y);

  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`File: ${data.fileName}`, margin, y);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin - 30, y);

  doc.setTextColor(0);
  y += 12;

  // ---------- ATS SECTION ----------

  if (data.atsResult) {
    const r = data.atsResult;

    sectionHeader('ATS Score');

    // Big Score
    doc.setFontSize(28);
    doc.setTextColor(34, 197, 94);
    doc.text(`${r.overallScore}%`, margin, y);
    doc.setTextColor(0);
    y += 10;

    drawProgressBar('Keyword Score', r.keywordScore);
    drawProgressBar('Section Score', r.sectionScore);
    drawProgressBar('Formatting Score', r.formattingScore);

    // Keywords
    if (r.matchedKeywords.length > 0) {
      doc.setFont('helvetica', 'bold');
      writeText('Matched Keywords:', [34, 197, 94]);
      writeBulletList(r.matchedKeywords, [34, 197, 94]);
    }

    if (r.missingKeywords.length > 0) {
      doc.setFont('helvetica', 'bold');
      writeText('Missing Keywords:', [239, 68, 68]);
      writeBulletList(r.missingKeywords, [239, 68, 68]);
    }

    y += 5;
  }

  // ---------- ERRORS ----------

  if (data.errors && data.errors.totalIssues > 0) {
    sectionHeader(`Detected Issues (${data.errors.totalIssues})`);

    if (data.errors.grammarErrors.length > 0) {
      writeText('Grammar Issues:', [234, 179, 8]);

      data.errors.grammarErrors.forEach((err, i) => {
        checkPage(10);
        writeText(`${i + 1}. "${err.error_text}"`);
        writeText(`Suggestion: ${err.suggestions?.[0] || ''}`, [0, 120, 200]);
        y += 3;
      });
    }

    if (data.errors.unprofessionalIssues.length > 0) {
      writeText('Unprofessional Content:', [239, 68, 68]);

      data.errors.unprofessionalIssues.forEach((err, i) => {
        checkPage(10);
        writeText(`${i + 1}. "${err.error_text}"`);
        writeText(`Suggestion: ${err.suggestions?.[0] || ''}`, [0, 120, 200]);
        y += 3;
      });
    }

    y += 5;
  }

  // ---------- ROLE MATCH ----------

  if (data.roleMatches?.length) {
    sectionHeader('Role Matches');

    data.roleMatches.forEach((m) => {
      checkPage(15);

      doc.setFont('helvetica', 'bold');
      doc.text(m.role, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.text(`${m.matchPercentage}%`, pageWidth - margin - 10, y);

      y += 6;

      if (m.matchedSkills.length) {
        writeText(`Matched: ${m.matchedSkills.join(', ')}`, [34, 197, 94]);
      }

      if (m.missingSkills.length) {
        writeText(`Missing: ${m.missingSkills.join(', ')}`, [239, 68, 68]);
      }

      y += 4;
    });
  }

  // ---------- ROLE EVALUATION ----------

  if (data.roleEval) {
    const ev = data.roleEval;

    sectionHeader(`Role Evaluation: ${ev.role}`);

    doc.setFontSize(16);
    doc.text(`Overall Score: ${ev.overallScore}%`, margin, y);
    y += 8;

    ev.sectionScores.forEach((s) => {
      checkPage(6);

      const symbol = s.found ? '✓' : '✗';
      const color = s.found ? [34, 197, 94] : [239, 68, 68];

      doc.setTextColor(...color);
      doc.text(`${symbol} ${s.name}`, margin, y);

      doc.setTextColor(0);
      doc.text(`${s.score}%`, pageWidth - margin - 10, y);

      y += 6;
    });

    if (ev.matchedSkills.length) {
      writeText(`Matched Skills: ${ev.matchedSkills.join(', ')}`, [34, 197, 94]);
    }

    if (ev.missingSkills.length) {
      writeText(`Missing Skills: ${ev.missingSkills.join(', ')}`, [239, 68, 68]);
    }
  }

  // ---------- SAVE ----------
  doc.save(`ResumeIQ_Report_${data.fileName.replace(/\.[^.]+$/, '')}.pdf`);
}