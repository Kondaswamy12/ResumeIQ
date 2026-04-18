import jsPDF from 'jspdf';

export function exportResultsToPdf(data: any) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const COLORS = {
    primary: [37, 99, 235],
    green: [22, 163, 74],
    amber: [245, 158, 11],
    red: [239, 68, 68],
    text: [17, 24, 39],
    subtext: [107, 114, 128],
    light: [229, 231, 235],
  };

  const today = new Date().toLocaleDateString();

  const checkPage = (space = 10) => {
    if (y + space > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // ---------- HEADER ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text('ResumeIQ Report', margin, y);

  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.subtext);
  doc.setFont('helvetica', 'normal');
  doc.text(`File: ${data.fileName}`, margin, y);
  y += 5;
  doc.text(`Generated on: ${today}`, margin, y);

  y += 12;

  // ---------- SECTION HEADER ----------
  const sectionHeader = (title: string) => {
    checkPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(title, margin, y);

    y += 4;

    doc.setDrawColor(...COLORS.light);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;
  };

  // ---------- TEXT ----------
  const writeText = (text: string, small = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(small ? 10 : 11);
    doc.setTextColor(...COLORS.text);

    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);

    y += lines.length * 6;
  };

  // ---------- PROGRESS BAR ----------
  const drawProgressBar = (label: string, value: number) => {
    checkPage(15);

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text(label, margin, y);

    doc.text(`${value}%`, pageWidth - margin - 10, y);
    y += 4;

    // background
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, contentWidth, 6, 3, 3, 'F');

    // color logic
    const color =
      value >= 90 ? COLORS.green :
      value >= 70 ? COLORS.primary :
      value >= 50 ? COLORS.amber :
      COLORS.red;

    doc.setFillColor(...color);
    doc.roundedRect(
      margin,
      y,
      (value / 100) * contentWidth,
      6,
      3,
      3,
      'F'
    );

    y += 10;
  };

  // ---------- TAGS (KEYWORDS) ----------
  const drawTags = (items: string[]) => {
    let x = margin;
    const paddingX = 4;
    const paddingY = 3;

    items.forEach((item) => {
      const textWidth = doc.getTextWidth(item);
      const boxWidth = textWidth + paddingX * 2;

      if (x + boxWidth > pageWidth - margin) {
        x = margin;
        y += 8;
      }

      doc.setFillColor(...COLORS.light);
      doc.roundedRect(x, y - 4, boxWidth, 6, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      doc.text(item, x + paddingX, y);

      x += boxWidth + 4;
    });

    y += 10;
  };

  // ---------- ATS SECTION ----------
  if (data.atsResult) {
    const r = data.atsResult;

    sectionHeader('ATS Analysis');

    // Big Score
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`${r.overallScore}%`, margin, y);

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.subtext);
    doc.text('Overall ATS Score', margin + 30, y);

    y += 12;

    drawProgressBar('Keyword Match', r.keywordScore);
    drawProgressBar('Section Quality', r.sectionScore);
    drawProgressBar('Formatting', r.formattingScore);

    if (r.matchedKeywords.length) {
      writeText('Matched Keywords:', true);
      drawTags(r.matchedKeywords);
    }

    if (r.missingKeywords.length) {
      writeText('Missing Keywords:', true);
      drawTags(r.missingKeywords);
    }
  }

  // ---------- ERRORS ----------
  if (data.errors?.length) {
    sectionHeader(`Detected Issues (${data.errors.length})`);

    data.errors.forEach((e, i) => {
      checkPage(10);

      doc.setTextColor(...COLORS.red);
      writeText(`${i + 1}. ${e.message}`);

      if (e.suggestions?.length) {
        doc.setTextColor(...COLORS.subtext);
        writeText(`Suggestion: ${e.suggestions[0]}`, true);
      }
    });
  }

  // ---------- ROLE MATCH ----------
  if (data.roleMatches?.length) {
    sectionHeader('Role Matches');

    data.roleMatches.forEach((r) => {
      drawProgressBar(r.role, r.matchPercentage);
    });
  }

  // ---------- ROLE EVAL ----------
  if (data.roleEval) {
    const ev = data.roleEval;

    sectionHeader(`Role Evaluation: ${ev.role}`);

    drawProgressBar('Overall Score', ev.overallScore);

    ev.sectionScores.forEach((s) => {
      drawProgressBar(s.name, s.score);
    });
  }

  // ---------- FOOTER ----------
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.subtext);

    doc.text(
      `Generated by ResumeIQ • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  doc.save(`ResumeIQ_${data.fileName}.pdf`);
}