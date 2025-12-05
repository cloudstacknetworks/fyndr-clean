/**
 * STEP 61: Buyer Evaluation Workspace - PDF Generator
 * 
 * Generates comprehensive PDF evaluation reports
 */

import { EvaluationWorkspaceData } from './evaluation-engine';

export function generateEvaluationHtml(workspaceData: EvaluationWorkspaceData): string {
  const { rfp, supplier, summary, scoringItems } = workspaceData;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getVarianceColor = (varianceLevel: 'low' | 'medium' | 'high') => {
    switch (varianceLevel) {
      case 'low':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Evaluation Report - ${supplier.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .summary-section {
      background: #f3f4f6;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
    }
    
    .summary-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .summary-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    
    .flags-section {
      margin-bottom: 30px;
    }
    
    .flag {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    .flag-red {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .flag-yellow {
      background: #fef3c7;
      color: #92400e;
    }
    
    .flag-orange {
      background: #ffedd5;
      color: #9a3412;
    }
    
    h2 {
      font-size: 20px;
      margin-bottom: 15px;
      color: #1f2937;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 8px;
    }
    
    .scoring-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 11px;
    }
    
    .scoring-table th {
      background: #3b82f6;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }
    
    .scoring-table td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .scoring-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }
    
    .badge-must-have {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .badge-violation {
      background: #dc2626;
      color: white;
    }
    
    .score-auto {
      font-weight: bold;
      color: #1f2937;
    }
    
    .score-override {
      font-weight: bold;
      color: #3b82f6;
    }
    
    .variance-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      color: white;
    }
    
    .justification {
      margin-top: 5px;
      padding: 8px;
      background: #f3f4f6;
      border-left: 3px solid #3b82f6;
      font-size: 10px;
      font-style: italic;
    }
    
    .comments-section {
      margin-top: 10px;
      padding: 10px;
      background: #fef3c7;
      border-radius: 4px;
    }
    
    .comment {
      margin-bottom: 8px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      font-size: 10px;
    }
    
    .comment-meta {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 3px;
    }
    
    .comment-timestamp {
      color: #6b7280;
      font-size: 9px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Evaluation Report</h1>
    <p><strong>${supplier.name}</strong> - ${supplier.email}</p>
    <p>RFP: ${rfp.title}</p>
  </div>
  
  <div class="summary-section">
    <h2>Evaluation Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Score</div>
        <div class="summary-value">${summary.totalOverrideScore.toFixed(0)}/100</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Weighted Score</div>
        <div class="summary-value">${summary.totalWeightedOverrideScore.toFixed(0)}/100</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Overrides Applied</div>
        <div class="summary-value">${summary.overrideCount}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Comments Added</div>
        <div class="summary-value">${summary.commentCount}</div>
      </div>
    </div>
  </div>
  
  ${
    summary.mustHaveFailures > 0 ||
    summary.missingResponses > 0 ||
    summary.averageVariance > 3
      ? `
  <div class="flags-section">
    <h2>Flags & Alerts</h2>
    ${
      summary.mustHaveFailures > 0
        ? `<span class="flag flag-red">⚠ ${summary.mustHaveFailures} Must-Have Failure${
            summary.mustHaveFailures > 1 ? 's' : ''
          }</span>`
        : ''
    }
    ${
      summary.missingResponses > 0
        ? `<span class="flag flag-yellow">⚠ ${summary.missingResponses} Missing Response${
            summary.missingResponses > 1 ? 's' : ''
          }</span>`
        : ''
    }
    ${
      summary.averageVariance > 3
        ? `<span class="flag flag-orange">⚠ High Scoring Variance (${summary.averageVariance.toFixed(
            1
          )})</span>`
        : ''
    }
  </div>
  `
      : ''
  }
  
  <h2>Detailed Scoring Matrix</h2>
  <table class="scoring-table">
    <thead>
      <tr>
        <th style="width: 25%;">Requirement</th>
        <th style="width: 30%;">Supplier Response</th>
        <th style="width: 8%; text-align: center;">Auto Score</th>
        <th style="width: 8%; text-align: center;">Override</th>
        <th style="width: 8%; text-align: center;">Variance</th>
        <th style="width: 21%;">Justification & Comments</th>
      </tr>
    </thead>
    <tbody>
      ${scoringItems
        .map(
          (item) => `
      <tr>
        <td>
          <strong>${item.requirementTitle}</strong>
          ${item.mustHave ? '<br><span class="badge badge-must-have">Must-Have</span>' : ''}
          ${
            item.mustHaveViolation
              ? '<br><span class="badge badge-violation">⚠ Violation</span>'
              : ''
          }
        </td>
        <td style="font-size: 10px; color: #4b5563;">
          ${
            item.supplierResponseText
              ? item.supplierResponseText.substring(0, 200) +
                (item.supplierResponseText.length > 200 ? '...' : '')
              : '<span style="color: #9ca3af; font-style: italic;">No response</span>'
          }
        </td>
        <td style="text-align: center;" class="score-auto">
          ${item.autoScore.toFixed(0)}
        </td>
        <td style="text-align: center;" ${
          item.overrideScore !== null ? 'class="score-override"' : ''
        }>
          ${item.overrideScore !== null ? item.overrideScore.toFixed(0) : '—'}
        </td>
        <td style="text-align: center;">
          ${
            item.variance > 0
              ? `<span class="variance-badge" style="background-color: ${getVarianceColor(
                  item.varianceLevel
                )};">${item.variance.toFixed(1)}</span>`
              : '—'
          }
        </td>
        <td>
          ${
            item.overrideJustification
              ? `<div class="justification">${item.overrideJustification}</div>`
              : ''
          }
          ${
            item.comments.length > 0
              ? `
            <div class="comments-section">
              <strong style="font-size: 10px;">Comments (${item.comments.length}):</strong>
              ${item.comments
                .map(
                  (comment) => `
                <div class="comment">
                  <div class="comment-meta">${comment.userName}</div>
                  <div>${comment.commentText}</div>
                  <div class="comment-timestamp">${formatDate(comment.timestamp)}</div>
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
        </td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Generated on ${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}</p>
    <p>Fyndr RFP Management System - Evaluation Report</p>
  </div>
</body>
</html>
  `;
}
