/**
 * STEP 43: Supplier Outcome Dashboard - PDF Export
 * 
 * GET /api/dashboard/rfps/[id]/supplier-outcomes/pdf
 * Generates branded PDF with FYNDR header, Aurelius footer, all sections
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildSupplierOutcomeDashboard } from "@/lib/supplier-outcome/supplier-outcome-engine";
import { generatePdfFromHtml } from "@/lib/export-utils";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Buyer-only access (403 for suppliers)
    if (session.user.role !== "buyer") {
      return NextResponse.json(
        { error: "Forbidden: Supplier Outcome Dashboard is buyer-only" },
        { status: 403 }
      );
    }

    // 3. Extract RFP ID
    const rfpId = context.params.id;
    const userId = session.user.id;

    // 4. Build dashboard (includes RFP ownership check)
    const dashboard = await buildSupplierOutcomeDashboard(rfpId, userId);

    // 5. Generate HTML for PDF
    const html = generateSupplierOutcomesPdfHtml(dashboard);

    // 6. Convert HTML to PDF buffer
    const pdfBuffer = await generatePdfFromHtml(html);

    // 7. Log activity: SUPPLIER_OUTCOMES_EXPORTED
    await logActivityWithRequest(req, {
      userId,
      eventType: EVENT_TYPES.SUPPLIER_OUTCOMES_EXPORTED,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      summary: `Exported supplier outcome dashboard PDF for "${dashboard.rfpTitle}"`,
      details: {
        rfpId,
        rfpTitle: dashboard.rfpTitle,
        totalSuppliers: dashboard.highLevel.totalSuppliers,
        exportFormat: "PDF",
      },
    });

    // 8. Return PDF with proper headers
    const sanitizedTitle = dashboard.rfpTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Supplier_Outcomes_${sanitizedTitle}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[Supplier Outcomes PDF API] Error:", error);
    
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to generate supplier outcomes PDF" },
      { status: 500 }
    );
  }
}

// ==============================================================================
// PDF HTML Generator
// ==============================================================================

function generateSupplierOutcomesPdfHtml(dashboard: any): string {
  const { rfpTitle, suppliers, highLevel, generatedAt } = dashboard;

  // Helper function to get outcome badge color
  const getOutcomeBadgeColor = (outcome: string): string => {
    switch (outcome) {
      case "awarded":
      case "recommended":
        return "background-color: #10b981; color: white;";
      case "shortlisted":
        return "background-color: #f59e0b; color: white;";
      case "not_selected":
        return "background-color: #ef4444; color: white;";
      case "declined":
        return "background-color: #6b7280; color: white;";
      case "cancelled":
        return "background-color: #dc2626; color: white;";
      default:
        return "background-color: #9ca3af; color: white;";
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #1f2937;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      color: #4f46e5;
      font-weight: bold;
    }
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    .cover-section {
      text-align: center;
      padding: 40px 0;
    }
    .cover-section h2 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .cover-section .meta {
      font-size: 12px;
      color: #6b7280;
      margin-top: 20px;
    }
    .summary-section {
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .summary-section h3 {
      margin-top: 0;
      color: #4f46e5;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .summary-item {
      padding: 10px;
      background: white;
      border-radius: 4px;
    }
    .summary-item .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .summary-item .value {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #4b5563;
      font-size: 12px;
      text-transform: uppercase;
    }
    td {
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .supplier-detail {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .supplier-detail h4 {
      margin-top: 0;
      color: #1f2937;
    }
    .supplier-detail .scores {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 15px 0;
    }
    .score-box {
      padding: 10px;
      background: #f9fafb;
      border-radius: 4px;
      text-align: center;
    }
    .score-box .label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .score-box .value {
      font-size: 20px;
      font-weight: bold;
      color: #4f46e5;
    }
    .list-section {
      margin: 15px 0;
    }
    .list-section h5 {
      font-size: 14px;
      margin-bottom: 8px;
      color: #4b5563;
    }
    .list-section ul {
      margin: 0;
      padding-left: 20px;
    }
    .list-section li {
      font-size: 12px;
      margin-bottom: 5px;
      color: #374151;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <!-- FYNDR Header -->
  <div class="header">
    <h1>FYNDR</h1>
    <div class="subtitle">Supplier Outcome Dashboard</div>
  </div>

  <!-- Cover Page -->
  <div class="cover-section">
    <h2>${escapeHtml(rfpTitle)}</h2>
    <div class="meta">
      Generated: ${new Date(generatedAt).toLocaleString()}<br>
      Total Suppliers: ${highLevel.totalSuppliers}
    </div>
  </div>

  <div class="page-break"></div>

  <!-- High-Level Summary -->
  <div class="summary-section">
    <h3>High-Level Summary</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="label">Total Suppliers</div>
        <div class="value">${highLevel.totalSuppliers}</div>
      </div>
      <div class="summary-item">
        <div class="label">Shortlisted</div>
        <div class="value">${highLevel.totalShortlisted}</div>
      </div>
      <div class="summary-item">
        <div class="label">Declined</div>
        <div class="value">${highLevel.totalDeclined}</div>
      </div>
      <div class="summary-item">
        <div class="label">Awarded</div>
        <div class="value">${highLevel.totalAwarded}</div>
      </div>
      <div class="summary-item">
        <div class="label">Winner</div>
        <div class="value">${escapeHtml(highLevel.winnerName || "TBD")}</div>
      </div>
      <div class="summary-item">
        <div class="label">Average Score</div>
        <div class="value">${highLevel.averageScore ?? "N/A"}</div>
      </div>
    </div>
  </div>

  <!-- Supplier Summary Table -->
  <h3>Supplier Summary Table</h3>
  <table>
    <thead>
      <tr>
        <th>Supplier</th>
        <th>Outcome</th>
        <th>Overall Score</th>
        <th>Weighted Score</th>
        <th>Must-Have %</th>
      </tr>
    </thead>
    <tbody>
      ${suppliers.map((s: any) => `
        <tr>
          <td>${escapeHtml(s.supplierName)}</td>
          <td><span class="badge" style="${getOutcomeBadgeColor(s.awardOutcome)}">${s.awardOutcome.toUpperCase()}</span></td>
          <td>${s.overallScore ?? "–"}</td>
          <td>${s.weightedScore ?? "–"}</td>
          <td>${s.mustHaveCompliance !== null ? s.mustHaveCompliance.toFixed(0) + "%" : "–"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- Detailed Supplier Sections -->
  <h3>Detailed Supplier Breakdown</h3>
  ${suppliers.map((s: any, index: number) => `
    <div class="supplier-detail">
      <h4>${index + 1}. ${escapeHtml(s.supplierName)}</h4>
      <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">
        Contact: ${escapeHtml(s.contactName || "N/A")} | Email: ${escapeHtml(s.contactEmail || "N/A")}
      </p>
      <p style="margin: 5px 0;"><span class="badge" style="${getOutcomeBadgeColor(s.awardOutcome)}">${s.awardOutcome.toUpperCase()}</span></p>
      
      <div class="scores">
        <div class="score-box">
          <div class="label">Overall Score</div>
          <div class="value">${s.overallScore ?? "N/A"}</div>
        </div>
        <div class="score-box">
          <div class="label">Weighted Score</div>
          <div class="value">${s.weightedScore ?? "N/A"}</div>
        </div>
        <div class="score-box">
          <div class="label">Must-Have Compliance</div>
          <div class="value">${s.mustHaveCompliance !== null ? s.mustHaveCompliance.toFixed(0) + "%" : "N/A"}</div>
        </div>
      </div>

      ${s.strengths.length > 0 ? `
        <div class="list-section">
          <h5>Strengths</h5>
          <ul>
            ${s.strengths.map((strength: string) => `<li>${escapeHtml(strength)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      ${s.weaknesses.length > 0 ? `
        <div class="list-section">
          <h5>Weaknesses</h5>
          <ul>
            ${s.weaknesses.map((weakness: string) => `<li>${escapeHtml(weakness)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
    </div>
  `).join("")}

  <!-- Aurelius Footer -->
  <div class="footer">
    Powered by Aurelius &copy; ${new Date().getFullYear()} | FYNDR RFP Management System
  </div>
</body>
</html>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
