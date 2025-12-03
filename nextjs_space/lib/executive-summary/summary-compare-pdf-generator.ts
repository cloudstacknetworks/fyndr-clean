/**
 * STEP 46: Executive Summary Comparison PDF Generator
 * 
 * Generates branded PDF reports for Executive Summary version comparisons
 * with FYNDR branding and Aurelius footer.
 */

import { generatePdfFromHtml } from '@/lib/export-utils';
import type { ComparisonResult } from './summary-compare-engine';

interface GenerateComparisonPdfInput {
  comparison: ComparisonResult;
  rfpTitle: string;
  versionA: number;
  versionB: number;
}

/**
 * Generates a branded PDF for an Executive Summary comparison
 */
export async function generateComparisonPdf(
  input: GenerateComparisonPdfInput
): Promise<Buffer> {
  const html = generateComparisonHtml(input);
  return generatePdfFromHtml(html);
}

/**
 * Generates the HTML content for the comparison PDF
 */
function generateComparisonHtml(input: GenerateComparisonPdfInput): string {
  const { comparison, rfpTitle, versionA, versionB } = input;
  const { metadata, structuralDiff, semanticDiff, AIComparisonNarrative, scoring } = comparison;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Summary Comparison - v${versionA} vs v${versionB}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      padding: 20px;
    }
    
    /* FYNDR Header */
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 14pt;
      opacity: 0.95;
      font-weight: 400;
    }
    
    /* Version Metadata */
    .metadata-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
    }
    
    .version-box {
      flex: 1;
      padding: 15px;
      background: white;
      border-radius: 6px;
      margin: 0 10px;
      border: 2px solid #e5e7eb;
    }
    
    .version-box:first-child {
      margin-left: 0;
    }
    
    .version-box:last-child {
      margin-right: 0;
    }
    
    .version-box h3 {
      font-size: 14pt;
      color: #4f46e5;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .version-box .meta-item {
      margin-bottom: 8px;
      font-size: 10pt;
    }
    
    .version-box .meta-label {
      font-weight: 600;
      color: #6b7280;
      display: inline-block;
      width: 100px;
    }
    
    /* Sections */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 16pt;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #4f46e5;
      font-weight: 600;
    }
    
    .section h3 {
      font-size: 13pt;
      color: #4f46e5;
      margin-top: 20px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    /* AI Narrative */
    .narrative {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 10.5pt;
      line-height: 1.7;
    }
    
    .narrative p {
      margin-bottom: 12px;
    }
    
    .narrative p:last-child {
      margin-bottom: 0;
    }
    
    /* Scoring Table */
    .scoring-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .scoring-table th,
    .scoring-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .scoring-table th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
      font-size: 10pt;
    }
    
    .scoring-table td {
      font-size: 10pt;
    }
    
    .score-bar {
      height: 20px;
      background: #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }
    
    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%);
      transition: width 0.3s;
    }
    
    .score-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: 600;
      font-size: 9pt;
      color: #1f2937;
    }
    
    /* Lists */
    .change-list {
      list-style: none;
      padding: 0;
      margin: 15px 0;
    }
    
    .change-list li {
      padding: 10px 15px;
      margin-bottom: 8px;
      border-radius: 6px;
      font-size: 10pt;
      line-height: 1.5;
    }
    
    .change-list.added li {
      background: #d1fae5;
      border-left: 3px solid #10b981;
    }
    
    .change-list.removed li {
      background: #fee2e2;
      border-left: 3px solid #ef4444;
    }
    
    .change-list.modified li {
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
    }
    
    .change-list.strengthened li {
      background: #dbeafe;
      border-left: 3px solid #3b82f6;
    }
    
    .change-list.weakened li {
      background: #fce7f3;
      border-left: 3px solid #ec4899;
    }
    
    .change-list.risks li {
      background: #fef2f2;
      border-left: 3px solid #dc2626;
    }
    
    .change-list.recommendations li {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
    }
    
    .empty-state {
      color: #9ca3af;
      font-style: italic;
      padding: 15px;
      text-align: center;
      background: #f9fafb;
      border-radius: 6px;
      font-size: 10pt;
    }
    
    /* Aurelius Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 9pt;
    }
    
    .footer strong {
      color: #4f46e5;
      font-weight: 600;
    }
    
    /* Page Break Control */
    @media print {
      .section {
        page-break-inside: avoid;
      }
      
      .header {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>

  <!-- FYNDR Header -->
  <div class="header">
    <h1>Executive Summary Comparison</h1>
    <div class="subtitle">${escapeHtml(rfpTitle)}</div>
    <div class="subtitle" style="margin-top: 8px;">Version ${versionA} vs Version ${versionB}</div>
  </div>

  <!-- Version Metadata -->
  <div class="metadata-section">
    <div class="version-box">
      <h3>Version ${versionA} (Baseline)</h3>
      <div class="meta-item">
        <span class="meta-label">Tone:</span> ${escapeHtml(metadata.summaryA.tone)}
      </div>
      <div class="meta-item">
        <span class="meta-label">Audience:</span> ${escapeHtml(metadata.summaryA.audience)}
      </div>
      <div class="meta-item">
        <span class="meta-label">Updated:</span> ${formatDate(metadata.summaryA.updatedAt)}
      </div>
    </div>
    
    <div class="version-box">
      <h3>Version ${versionB} (Comparison)</h3>
      <div class="meta-item">
        <span class="meta-label">Tone:</span> ${escapeHtml(metadata.summaryB.tone)}
      </div>
      <div class="meta-item">
        <span class="meta-label">Audience:</span> ${escapeHtml(metadata.summaryB.audience)}
      </div>
      <div class="meta-item">
        <span class="meta-label">Updated:</span> ${formatDate(metadata.summaryB.updatedAt)}
      </div>
    </div>
  </div>

  <!-- AI Narrative -->
  <div class="section">
    <h2>Executive Analysis</h2>
    <div class="narrative">
      ${formatNarrativeParagraphs(AIComparisonNarrative)}
    </div>
  </div>

  <!-- Change Metrics -->
  <div class="section">
    <h2>Change Metrics</h2>
    <table class="scoring-table">
      <thead>
        <tr>
          <th style="width: 40%;">Metric</th>
          <th style="width: 15%;">Score</th>
          <th style="width: 45%;">Visualization</th>
        </tr>
      </thead>
      <tbody>
        ${generateScoreRow('Overall Change Impact', scoring.overallChangeScore)}
        ${generateScoreRow('Narrative Shift', scoring.narrativeShiftScore)}
        ${generateScoreRow('Risk Assessment Shift', scoring.riskShiftScore)}
        ${generateScoreRow('Recommendation Shift', scoring.recommendationShiftScore)}
      </tbody>
    </table>
  </div>

  <!-- Structural Differences -->
  <div class="section">
    <h2>Structural Differences</h2>
    
    ${generateListSection('Sections Added', structuralDiff.sectionsAdded, 'added')}
    ${generateListSection('Sections Removed', structuralDiff.sectionsRemoved, 'removed')}
    ${generateListSection('Sections Modified', structuralDiff.sectionsModified, 'modified')}
  </div>

  <!-- Semantic Differences -->
  <div class="section">
    <h2>Semantic Differences</h2>
    
    ${generateListSection('Strengthening Changes', semanticDiff.strengtheningChanges, 'strengthened')}
    ${generateListSection('Weakening Changes', semanticDiff.weakeningChanges, 'weakened')}
    ${generateListSection('Risk Shifts', semanticDiff.riskShifts, 'risks')}
    ${generateListSection('Recommendation Shifts', semanticDiff.recommendationShifts, 'recommendations')}
    ${generateListSection('New Insights Added', semanticDiff.newInsightsAdded, 'added')}
    ${generateListSection('Omissions Detected', semanticDiff.omissionsDetected, 'removed')}
  </div>

  <!-- Aurelius Footer -->
  <div class="footer">
    <p>Powered by <strong>FYNDR</strong> | AI-Driven RFP Management Platform</p>
    <p style="margin-top: 8px;">© ${new Date().getFullYear()} Aurelius AI. All rights reserved.</p>
    <p style="margin-top: 4px; font-size: 8pt;">Generated on ${new Date().toLocaleString()}</p>
  </div>

</body>
</html>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatNarrativeParagraphs(narrative: string): string {
  const paragraphs = narrative.split('\n\n').filter(p => p.trim());
  return paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('\n');
}

function generateScoreRow(label: string, score: number): string {
  return `
    <tr>
      <td><strong>${escapeHtml(label)}</strong></td>
      <td>${score}/100</td>
      <td>
        <div class="score-bar">
          <div class="score-fill" style="width: ${score}%;"></div>
          <div class="score-text">${score}%</div>
        </div>
      </td>
    </tr>
  `;
}

function generateListSection(title: string, items: string[], styleClass: string): string {
  if (items.length === 0) {
    return `
      <h3>${escapeHtml(title)}</h3>
      <div class="empty-state">No ${title.toLowerCase()} detected</div>
    `;
  }
  
  const listItems = items.map(item => `<li>${escapeHtml(item)}</li>`).join('\n');
  
  return `
    <h3>${escapeHtml(title)}</h3>
    <ul class="change-list ${styleClass}">
      ${listItems}
    </ul>
  `;
}
