/**
 * STEP 42: Supplier Debrief Pack PDF Generator
 * Generates professional PDF reports for supplier debriefs
 */

import { SupplierDebriefData } from "./debrief-pack-service";

/**
 * Generates HTML for the supplier debrief PDF
 */
export function generateSupplierDebriefHtml(data: SupplierDebriefData): string {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score === null) return "score-na";
    if (score >= 80) return "score-high";
    if (score >= 60) return "score-medium";
    return "score-low";
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return "#6b7280"; // Gray
    if (score >= 80) return "#10b981"; // Green
    if (score >= 60) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const getRankBadgeColor = (rank: number | null) => {
    if (rank === null) return "#6b7280";
    if (rank === 1) return "#fbbf24"; // Gold
    if (rank === 2) return "#94a3b8"; // Silver
    if (rank === 3) return "#cd7f32"; // Bronze
    return "#6b7280"; // Gray
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Supplier Debrief Pack - ${data.supplierName}</title>
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
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .supplier-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 16px;
      margin-top: 15px;
      background: white;
      color: #667eea;
    }
    
    .content {
      padding: 0 40px 40px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .info-item {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .highlight-card {
      background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
      border: 2px solid #667eea;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .highlight-title {
      font-size: 14px;
      font-weight: 600;
      color: #4c1d95;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    
    .score-display {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
    
    .score-item {
      text-align: center;
    }
    
    .score-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    
    .score-value {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
    }
    
    .rank-badge {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 50%;
      font-size: 24px;
      font-weight: bold;
      background: ${getRankBadgeColor(data.rank)};
      color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .score-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .score-high {
      background: #d1fae5;
      color: #065f46;
    }
    
    .score-medium {
      background: #fef3c7;
      color: #92400e;
    }
    
    .score-low {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .score-na {
      background: #f3f4f6;
      color: #6b7280;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .table th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    
    .table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      vertical-align: top;
    }
    
    .table tr:last-child td {
      border-bottom: none;
    }
    
    .table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .list {
      list-style: none;
      padding: 0;
    }
    
    .list-item {
      padding: 10px 15px;
      margin-bottom: 8px;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .strength-item {
      background: #d1fae5;
      border-left: 3px solid #10b981;
    }
    
    .improvement-item {
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
    }
    
    .failed-item {
      background: #fee2e2;
      border-left: 3px solid #ef4444;
    }
    
    .narrative-box {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-top: 15px;
    }
    
    .narrative-box p {
      font-size: 14px;
      line-height: 1.8;
      color: #1f2937;
      white-space: pre-wrap;
    }
    
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin-top: 15px;
    }
    
    .notes-box p {
      font-size: 14px;
      line-height: 1.8;
      color: #1f2937;
      white-space: pre-wrap;
    }
    
    .footer {
      margin-top: 40px;
      padding: 20px 40px;
      background: #f9fafb;
      border-top: 2px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    
    .compliance-indicator {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
    }
    
    .compliant-yes {
      background: #d1fae5;
      color: #065f46;
    }
    
    .compliant-partial {
      background: #fef3c7;
      color: #92400e;
    }
    
    .compliant-no {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .award-status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 10px;
    }
    
    .status-awarded {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-recommended {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-not-selected {
      background: #f3f4f6;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Supplier Debrief Pack</h1>
    <p>${data.rfpTitle}</p>
    <div class="supplier-badge">${data.supplierName}</div>
  </div>

  <div class="content">
    <!-- Performance Summary -->
    <div class="section">
      <h2 class="section-title">Performance Summary</h2>
      <div class="highlight-card">
        <div class="highlight-title">Your Scores & Ranking</div>
        <div class="score-display">
          <div class="score-item">
            <div class="score-label">Overall Score</div>
            <div class="score-value">
              ${data.overallScore !== null ? data.overallScore.toFixed(1) + "%" : "N/A"}
            </div>
          </div>
          ${data.weightedScore !== null ? `
          <div class="score-item">
            <div class="score-label">Weighted Score</div>
            <div class="score-value">
              ${data.weightedScore.toFixed(1)}%
            </div>
          </div>
          ` : ""}
          ${data.rank !== null ? `
          <div class="score-item">
            <div class="score-label">Rank</div>
            <div class="rank-badge">#${data.rank}</div>
          </div>
          ` : ""}
        </div>
        ${data.isSelected ? `
        <div class="award-status-badge status-${data.awardStatus?.replace('_', '-') || 'awarded'}">
          🏆 ${data.awardStatus === "awarded" ? "AWARDED" : "RECOMMENDED"}
        </div>
        ` : ""}
      </div>
    </div>

    <!-- RFP Information -->}
    <div class="section">
      <h2 class="section-title">RFP Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">RFP Title</div>
          <div class="info-value">${data.rfpTitle}</div>
        </div>
        <div class="info-item">
          <div class="info-label">RFP Created</div>
          <div class="info-value">${formatDate(data.rfpCreatedAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Award Date</div>
          <div class="info-value">${formatDate(data.rfpAwardedAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Debrief Generated</div>
          <div class="info-value">${formatDate(data.generatedAt)}</div>
        </div>
      </div>
    </div>

    <!-- Must-Have Compliance -->
    <div class="section">
      <h2 class="section-title">Must-Have Compliance</h2>
      <div class="info-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="info-item">
          <div class="info-label">Passed</div>
          <div class="info-value">
            <span class="compliance-indicator compliant-yes">${data.mustHaveCompliance.passed} / ${data.mustHaveCompliance.total}</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Failed</div>
          <div class="info-value">
            <span class="compliance-indicator ${data.mustHaveCompliance.failed > 0 ? 'compliant-no' : 'compliant-yes'}">${data.mustHaveCompliance.failed}</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Compliance Rate</div>
          <div class="info-value">
            ${data.mustHaveCompliance.total > 0 
              ? ((data.mustHaveCompliance.passed / data.mustHaveCompliance.total) * 100).toFixed(1) + "%" 
              : "N/A"}
          </div>
        </div>
      </div>
      
      ${data.mustHaveCompliance.failedRequirements.length > 0 ? `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">Failed Requirements</h3>
        <ul class="list">
          ${data.mustHaveCompliance.failedRequirements.map(req => `
            <li class="list-item failed-item">✗ ${req}</li>
          `).join("")}
        </ul>
      </div>
      ` : ""}
    </div>

    <!-- Category Performance -->
    ${data.categoryPerformance.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Category-Level Performance</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Category</th>
            <th style="width: 100px; text-align: center;">Score</th>
          </tr>
        </thead>
        <tbody>
          ${data.categoryPerformance.map(cat => `
            <tr>
              <td>
                <strong style="text-transform: capitalize;">${cat.category}</strong>
              </td>
              <td style="text-align: center;">
                ${cat.score !== null 
                  ? `<span class="score-badge ${getScoreBadgeClass(cat.score)}">${cat.score.toFixed(1)}%</span>`
                  : `<span class="score-badge score-na">N/A</span>`}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- Detailed Category Feedback -->
    ${data.categoryPerformance.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Detailed Category Feedback</h2>
      ${data.categoryPerformance.map(cat => `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px; text-transform: capitalize;">
            ${cat.category} ${cat.score !== null ? `(${cat.score.toFixed(1)}%)` : ""}
          </h3>
          
          ${cat.strengths.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #10b981; margin-bottom: 8px;">✓ Strengths</h4>
            <ul class="list">
              ${cat.strengths.map(s => `<li class="list-item strength-item">${s}</li>`).join("")}
            </ul>
          </div>
          ` : ""}
          
          ${cat.improvements.length > 0 ? `
          <div>
            <h4 style="font-size: 14px; font-weight: 600; color: #f59e0b; margin-bottom: 8px;">⚠ Areas for Improvement</h4>
            <ul class="list">
              ${cat.improvements.map(i => `<li class="list-item improvement-item">${i}</li>`).join("")}
            </ul>
          </div>
          ` : ""}
        </div>
      `).join("")}
    </div>
    ` : ""}

    <!-- AI Narrative -->
    ${data.aiNarrative ? `
    <div class="section">
      <h2 class="section-title">Overall Assessment</h2>
      <div class="narrative-box">
        <p>${data.aiNarrative.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
    ` : ""}

    <!-- Buyer Notes (only for selected supplier) -->
    ${data.buyerNotes && data.isSelected ? `
    <div class="section">
      <h2 class="section-title">Decision Rationale</h2>
      <div class="notes-box">
        <p>${data.buyerNotes.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
    ` : ""}

    <!-- Thank You Message -->
    <div class="section">
      <div style="background: #e0e7ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center;">
        <h3 style="color: #4c1d95; font-size: 18px; margin-bottom: 10px;">Thank You for Your Participation</h3>
        <p style="color: #6b7280; font-size: 14px;">
          We appreciate the time and effort you invested in responding to this RFP. 
          We hope this debrief pack provides valuable insights for your continuous improvement.
        </p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>FYNDR Supplier Debrief Pack</strong></p>
    <p>Generated on ${new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</p>
    <p style="margin-top: 10px; font-style: italic;">
      This debrief is intended for internal use and continuous improvement purposes.
    </p>
  </div>
</body>
</html>
  `;
}
