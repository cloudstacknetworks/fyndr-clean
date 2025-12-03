/**
 * STEP 47: Compliance Pack PDF Generator
 * Generates professional PDF reports for compliance pack snapshots
 */

import { CompliancePackSnapshot } from "./compliance-pack-service";

/**
 * Generates HTML for the compliance pack PDF
 */
export function generateCompliancePackHtml(
  rfpTitle: string,
  snapshot: CompliancePackSnapshot
): string {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderAwardSection = () => {
    if (!snapshot.award.awardStatus || snapshot.award.awardStatus === "not_awarded") {
      return `
        <div class="section">
          <h2>Award Decision</h2>
          <p class="text-muted">No award decision recorded</p>
        </div>
      `;
    }

    return `
      <div class="section">
        <h2>Award Decision</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Status</label>
            <div class="status-badge status-${snapshot.award.awardStatus}">
              ${snapshot.award.awardStatus?.toUpperCase() || "N/A"}
            </div>
          </div>
          <div class="info-item">
            <label>Decided At</label>
            <p>${formatDate(snapshot.award.awardDecidedAt)}</p>
          </div>
          <div class="info-item">
            <label>Decided By</label>
            <p>${snapshot.award.awardDecidedBy?.name || "N/A"} (${snapshot.award.awardDecidedBy?.email || "N/A"})</p>
          </div>
          ${snapshot.award.awardNotes ? `
            <div class="info-item full-width">
              <label>Decision Notes</label>
              <p>${snapshot.award.awardNotes}</p>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  };

  const renderSupplierOutcomes = () => {
    if (snapshot.supplierOutcomes.length === 0) {
      return `<p class="text-muted">No supplier outcomes recorded</p>`;
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Invitation Status</th>
            <th>Response Status</th>
            <th>Award Outcome</th>
            <th>Comparison Score</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.supplierOutcomes
            .map(
              (outcome) => `
            <tr>
              <td>
                <strong>${outcome.supplierName}</strong><br>
                <small>${outcome.contactEmail || "N/A"}</small>
              </td>
              <td>${outcome.invitationStatus || "N/A"}</td>
              <td>${outcome.responseStatus || "N/A"}</td>
              <td>${outcome.awardOutcomeStatus || "N/A"}</td>
              <td>${outcome.comparisonScore !== null ? outcome.comparisonScore.toFixed(1) : "N/A"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Compliance Pack - ${rfpTitle}</title>
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
      background: linear-gradient(135deg, #475569 0%, #1e293b 100%);
      color: white;
      padding: 40px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      background: #ffffff;
      color: #475569;
      margin-top: 10px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    h2 {
      font-size: 22px;
      color: #1e293b;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    h3 {
      font-size: 18px;
      color: #334155;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .info-item {
      background: #f8fafc;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    
    .info-item.full-width {
      grid-column: 1 / -1;
    }
    
    .info-item label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .info-item p {
      font-size: 14px;
      color: #1e293b;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    
    th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #334155;
      border-bottom: 2px solid #cbd5e1;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    tr:hover {
      background: #f8fafc;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-awarded {
      background: #dcfce7;
      color: #166534;
    }
    
    .status-recommended {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .text-muted {
      color: #94a3b8;
      font-style: italic;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    
    .stat-box {
      background: #f1f5f9;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }
    
    .stat-box .number {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .stat-box .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>RFP Compliance Pack</h1>
    <p>${rfpTitle}</p>
    <div class="badge">ARCHIVED</div>
    <div class="badge">Version ${snapshot.metadata.version}</div>
  </div>

  <div class="section">
    <h2>Archive Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>RFP ID</label>
        <p>${snapshot.rfpId}</p>
      </div>
      <div class="info-item">
        <label>Archived At</label>
        <p>${formatDate(snapshot.timeline.archivedAt)}</p>
      </div>
      <div class="info-item">
        <label>Archived By</label>
        <p>${snapshot.metadata.generatedBy.name || "N/A"} (${snapshot.metadata.generatedBy.email})</p>
      </div>
      <div class="info-item">
        <label>Company</label>
        <p>${snapshot.company.name}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>RFP Overview</h2>
    <div class="info-grid">
      <div class="info-item full-width">
        <label>Description</label>
        <p>${snapshot.rfpDescription || "No description provided"}</p>
      </div>
      <div class="info-item">
        <label>Created At</label>
        <p>${formatDate(snapshot.timeline.createdAt)}</p>
      </div>
      <div class="info-item">
        <label>Supplier</label>
        <p>${snapshot.supplier.name}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Timeline Summary</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>Q&A Period</label>
        <p>${formatDateShort(snapshot.timeline.askQuestionsStart)} - ${formatDateShort(snapshot.timeline.askQuestionsEnd)}</p>
      </div>
      <div class="info-item">
        <label>Submission Period</label>
        <p>${formatDateShort(snapshot.timeline.submissionStart)} - ${formatDateShort(snapshot.timeline.submissionEnd)}</p>
      </div>
      <div class="info-item">
        <label>Demo Window</label>
        <p>${formatDateShort(snapshot.timeline.demoWindowStart)} - ${formatDateShort(snapshot.timeline.demoWindowEnd)}</p>
      </div>
      <div class="info-item">
        <label>Award Date</label>
        <p>${formatDateShort(snapshot.timeline.awardDate)}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Activity Summary</h2>
    <div class="info-grid">
      <div class="stat-box">
        <div class="number">${snapshot.timelineSummary.totalQuestions}</div>
        <div class="label">Total Questions</div>
      </div>
      <div class="stat-box">
        <div class="number">${snapshot.timelineSummary.answeredQuestions}</div>
        <div class="label">Answered Questions</div>
      </div>
      <div class="stat-box">
        <div class="number">${snapshot.timelineSummary.totalBroadcasts}</div>
        <div class="label">Broadcasts Sent</div>
      </div>
      <div class="stat-box">
        <div class="number">${snapshot.timelineSummary.submittedResponses}</div>
        <div class="label">Submitted Responses</div>
      </div>
    </div>
  </div>

  ${renderAwardSection()}

  <div class="section">
    <h2>Supplier Outcomes</h2>
    ${renderSupplierOutcomes()}
  </div>

  ${snapshot.scoring.opportunityScore ? `
    <div class="section">
      <h2>Scoring Summary</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Opportunity Score</label>
          <p><strong>${snapshot.scoring.opportunityScore}/100</strong></p>
        </div>
        <div class="info-item">
          <label>Scoring Matrix</label>
          <p>${snapshot.scoring.scoringMatrix ? "Available" : "Not Available"}</p>
        </div>
      </div>
    </div>
  ` : ""}

  ${snapshot.executiveSummary.latest ? `
    <div class="section">
      <h2>Executive Summary</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Latest Version</label>
          <p>${formatDate(snapshot.executiveSummary.latest.createdAt)}</p>
        </div>
        <div class="info-item">
          <label>Total Versions</label>
          <p>${snapshot.executiveSummary.versions}</p>
        </div>
      </div>
    </div>
  ` : ""}

  <div class="footer">
    <p>This compliance pack was generated automatically on ${formatDate(snapshot.metadata.generatedAt)}</p>
    <p>RFP Compliance Pack v${snapshot.metadata.version} | ${snapshot.company.name}</p>
  </div>
</body>
</html>
  `;
}
