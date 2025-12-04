/**
 * Multi-RFP Comparison PDF Generator (STEP 49)
 * 
 * Generates a professional PDF report for multi-RFP comparison
 * using jsPDF.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ComparisonResult } from './multi-rfp-compare-engine';

export async function generateMultiRfpComparisonPdf(
  comparisonData: ComparisonResult
): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Multi-RFP Comparison Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
  doc.text(
    `Comparing ${comparisonData.rfpComparisons.length} RFPs`,
    pageWidth / 2,
    yPos + 5,
    { align: 'center' }
  );
  yPos += 20;

  // Section 1: Overview Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Overview Comparison', 14, yPos);
  yPos += 7;

  const overviewHeaders = ['RFP', 'Budget', 'Created', 'Suppliers', 'Cycle Time', 'Status'];
  const overviewRows = comparisonData.rfpComparisons.map((rfp) => [
    rfp.title,
    rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'N/A',
    new Date(rfp.createdAt).toLocaleDateString(),
    rfp.supplierCount.toString(),
    `${rfp.cycleTimeInDays} days`,
    rfp.awardStatus || 'Not awarded',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [overviewHeaders],
    body: overviewRows,
    theme: 'grid',
    headStyles: { fillColor: [213, 63, 140] }, // Fuchsia-600
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Section 2: Snapshot Availability
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Snapshot Availability', 14, yPos);
  yPos += 7;

  const snapshotHeaders = ['Snapshot Type', ...comparisonData.rfpComparisons.map((rfp) => rfp.title)];
  const snapshotTypes = ['Decision Brief', 'Scoring Matrix', 'Timeline State', 'Award Snapshot'];
  const snapshotRows = snapshotTypes.map((type, index) => {
    const key = [
      'decisionBrief',
      'scoringMatrix',
      'timelineState',
      'awardSnapshot',
    ][index] as keyof ComparisonResult['rfpComparisons'][0]['snapshotAvailability'];
    
    return [
      type,
      ...comparisonData.rfpComparisons.map((rfp) =>
        rfp.snapshotAvailability[key] ? 'Yes' : 'No'
      ),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [snapshotHeaders],
    body: snapshotRows,
    theme: 'grid',
    headStyles: { fillColor: [213, 63, 140] },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Section 3: Cross-RFP Insights
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cross-RFP Insights', 14, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const insights = comparisonData.crossInsights;
  const insightLines = [
    `Longest Cycle Time: ${insights.longestCycleTimeRfp || 'N/A'}`,
    `Shortest Cycle Time: ${insights.shortestCycleTimeRfp || 'N/A'}`,
    `Highest Budget: ${insights.highestBudgetRfp || 'N/A'}`,
    `Lowest Budget: ${insights.lowestBudgetRfp || 'N/A'}`,
    `Average Cycle Time: ${insights.avgCycleTime} days`,
    `Total Supplier Participation: ${insights.totalSupplierParticipation}`,
    `Budget Range: ${
      insights.budgetRange.min !== null && insights.budgetRange.max !== null
        ? `$${insights.budgetRange.min.toLocaleString()} - $${insights.budgetRange.max.toLocaleString()}`
        : 'N/A'
    }`,
  ];

  insightLines.forEach((line) => {
    doc.text(`• ${line}`, 14, yPos);
    yPos += 6;
  });

  // Algorithmic Insights
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Algorithmic Insights', 14, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  insights.algorithmicInsights.forEach((insight) => {
    const lines = doc.splitTextToSize(`• ${insight}`, pageWidth - 28);
    lines.forEach((line: string) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    yPos += 2;
  });

  // Section 4: Supplier Participation Map
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier Participation', 14, yPos);
  yPos += 7;

  const supplierEntries = Object.entries(comparisonData.supplierParticipationMap).sort(
    ([, a], [, b]) => b - a
  );

  if (supplierEntries.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No supplier participation data available', 14, yPos);
  } else {
    const supplierHeaders = ['Supplier Name', 'RFP Count'];
    const supplierRows = supplierEntries.map(([name, count]) => [name, count.toString()]);

    autoTable(doc, {
      startY: yPos,
      head: [supplierHeaders],
      body: supplierRows,
      theme: 'grid',
      headStyles: { fillColor: [213, 63, 140] },
      styles: { fontSize: 9 },
    });
  }

  // Convert to Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
