/**
 * STEP 41: Award Decision PDF Generator
 * Generates professional PDF reports for award decisions
 */

import { AwardSnapshot } from "./award-service";

/**
 * Generates HTML for the award decision PDF
 */
export function generateAwardDecisionHtml(
  rfp: any,
  snapshot: AwardSnapshot
): string {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "awarded":
        return "#10b981"; // Green
      case "recommended":
        return "#3b82f6"; // Blue
      case "cancelled":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "awarded":
        return "AWARDED";
      case "recommended":
        return "RECOMMENDED";
      case "cancelled":
        return "CANCELLED";
      default:
        return status.toUpperCase();
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Award Decision Report - ${rfp.title}</title>
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
    
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
      margin-top: 15px;
      background: white;
      color: ${statusBadgeColor(snapshot.status)};
      border: 2px solid ${statusBadgeColor(snapshot.status)};
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
    
    .winner-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
    }
    
    .winner-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .winner-name {
      font-size: 24px;
      font-weight: bold;
      color: #78350f;
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
      background: #f9fafb;
      padding: 12px 15px;
      margin-bottom: 8px;
      border-radius: 6px;
      border-left: 3px solid #667eea;
      font-size: 14px;
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
    
    .score-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
    }
    
    .score-high {
      background: #d1fae5;
      color: #065f46;
    }
    
    .score-medium {
      background: #fef3c7;
      color: #92400e;
    }
    
    .compliant-yes {
      color: #10b981;
      font-weight: 600;
    }
    
    .compliant-no {
      color: #ef4444;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Award Decision Report</h1>
    <p>${rfp.title}</p>
    <div class="status-badge">${statusLabel(snapshot.status)}</div>
  </div>

  <div class="content">
    <!-- RFP Information -->
    <div class="section">
      <h2 class="section-title">RFP Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">RFP ID</div>
          <div class="info-value">${rfp.id.substring(0, 8)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">${rfp.status || "N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Created Date</div>
          <div class="info-value">${formatDate(rfp.createdAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Award Decision Date</div>
          <div class="info-value">${formatDate(snapshot.decidedAt)}</div>
        </div>
      </div>
    </div>

    <!-- Selected Supplier -->
    ${
      snapshot.recommendedSupplierId && snapshot.status !== "cancelled"
        ? `
    <div class="section">
      <h2 class="section-title">Selected Supplier</h2>
      <div class="winner-card">
        <div class="winner-title">🏆 ${snapshot.status === "awarded" ? "Awarded Supplier" : "Recommended Supplier"}</div>
        <div class="winner-name">${snapshot.recommendedSupplierName || "N/A"}</div>
      </div>
    </div>
    `
        : snapshot.status === "cancelled"
        ? `
    <div class="section">
      <h2 class="section-title">Award Status</h2>
      <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px;">
        <p style="color: #991b1b; font-weight: 600; font-size: 16px;">This RFP has been cancelled. No supplier was awarded.</p>
      </div>
    </div>
    `
        : ""
    }

    <!-- Scoring Summary -->
    ${
      snapshot.scoringMatrixSummary.topSuppliers.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Top Suppliers - Scoring Summary</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Supplier Name</th>
            <th>Overall Score</th>
            <th>Weighted Score</th>
            <th>Must-Have Compliance</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.scoringMatrixSummary.topSuppliers
            .map(
              (s) => `
            <tr>
              <td><strong>${s.name}</strong></td>
              <td>
                ${
                  s.overallScore !== null
                    ? `<span class="score-badge ${
                        s.overallScore >= 80
                          ? "score-high"
                          : "score-medium"
                      }">${s.overallScore.toFixed(1)}</span>`
                    : "N/A"
                }
              </td>
              <td>
                ${
                  s.weightedScore !== null
                    ? `<span class="score-badge ${
                        s.weightedScore >= 80
                          ? "score-high"
                          : "score-medium"
                      }">${s.weightedScore.toFixed(1)}</span>`
                    : "N/A"
                }
              </td>
              <td>
                ${
                  s.mustHaveCompliance !== null
                    ? `<span class="${
                        s.mustHaveCompliance
                          ? "compliant-yes"
                          : "compliant-no"
                      }">${s.mustHaveCompliance ? "✓ Yes" : "✗ No"}</span>`
                    : "N/A"
                }
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- Decision Drivers -->
    ${
      snapshot.decisionBriefSummary.keyDrivers.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Key Decision Drivers</h2>
      <ul class="list">
        ${snapshot.decisionBriefSummary.keyDrivers
          .map(
            (driver) => `
          <li class="list-item">✓ ${driver}</li>
        `
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    <!-- Key Risks -->
    ${
      snapshot.decisionBriefSummary.keyRisks.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Key Risks & Considerations</h2>
      <ul class="list">
        ${snapshot.decisionBriefSummary.keyRisks
          .map(
            (risk) => `
          <li class="list-item" style="border-left-color: #f59e0b;">⚠ ${risk}</li>
        `
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    <!-- Timeline Summary -->
    <div class="section">
      <h2 class="section-title">Timeline Summary</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Created Date</div>
          <div class="info-value">${formatDate(
            snapshot.timelineSummary.createdAt
          )}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Target Award Date</div>
          <div class="info-value">${formatDate(
            snapshot.timelineSummary.targetAwardDate
          )}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Actual Award Date</div>
          <div class="info-value">${formatDate(
            snapshot.timelineSummary.actualAwardDate
          )}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Elapsed Days</div>
          <div class="info-value">${
            snapshot.timelineSummary.elapsedDays
          } days</div>
        </div>
      </div>
    </div>

    <!-- Buyer Notes -->
    ${
      snapshot.buyerNotes && snapshot.buyerNotes.trim()
        ? `
    <div class="section">
      <h2 class="section-title">Decision Rationale & Notes</h2>
      <div class="notes-box">
        <p>${snapshot.buyerNotes.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
    `
        : ""
    }

    <!-- Portfolio Context -->
    ${
      snapshot.portfolioSummary.companyName
        ? `
    <div class="section">
      <h2 class="section-title">Portfolio Context</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Company</div>
          <div class="info-value">${
            snapshot.portfolioSummary.companyName
          }</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total RFPs</div>
          <div class="info-value">${
            snapshot.portfolioSummary.totalRfps || "N/A"
          }</div>
        </div>
        <div class="info-item">
          <div class="info-label">Average Opportunity Score</div>
          <div class="info-value">${
            snapshot.portfolioSummary.averageScore !== null
              ? snapshot.portfolioSummary.averageScore.toFixed(1)
              : "N/A"
          }</div>
        </div>
      </div>
    </div>
    `
        : ""
    }
  </div>

  <div class="footer">
    <p><strong>FYNDR Award Decision Report</strong></p>
    <p>Generated on ${new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</p>
    <p style="margin-top: 10px; font-style: italic;">
      This is a pre-award decision record. FYNDR does not handle post-award procurement activities.
    </p>
  </div>
</body>
</html>
  `;
}
