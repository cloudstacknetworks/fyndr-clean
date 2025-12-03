/**
 * Portfolio Insights PDF Export API (STEP 44)
 * 
 * GET /api/dashboard/portfolio/insights/pdf
 * 
 * Generates and returns a branded PDF report with portfolio analytics.
 * Buyer-only access, company-scoped, 401 for unauthenticated.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildPortfolioInsights } from "@/lib/portfolio/portfolio-insights-engine";
import { logActivity } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";
import puppeteer from "puppeteer";

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Buyer-only check
    if (session.user.role !== "BUYER") {
      return NextResponse.json(
        { error: "Forbidden. This feature is only available to buyers." },
        { status: 403 }
      );
    }

    // 3. Get user's company ID and name from database
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rfps: {
          take: 1,
          select: { 
            companyId: true,
            company: {
              select: { name: true }
            }
          },
        },
      },
    });

    if (!user || user.rfps.length === 0) {
      return NextResponse.json(
        { error: "No RFPs found for your account." },
        { status: 404 }
      );
    }

    const companyId = user.rfps[0].companyId;
    const companyName = user.rfps[0].company?.name || "Your Company";

    // 4. Build portfolio insights
    const insights = await buildPortfolioInsights(companyId, userId);

    // 5. Generate HTML content
    const htmlContent = generatePortfolioPdfHtml(insights, companyName);

    // 6. Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });
    await browser.close();

    // 7. Log activity
    await logActivity({
      eventType: EVENT_TYPES.PORTFOLIO_INSIGHTS_EXPORTED,
      actorRole: ACTOR_ROLES.BUYER,
      summary: "Portfolio insights exported to PDF",
      userId,
      details: {
        totalRfps: insights.highLevelCounts.totalRfps,
        exportedAt: new Date().toISOString(),
      },
    });

    // 8. Return PDF
    const filename = `Portfolio_Insights_${new Date().toISOString().split("T")[0]}.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating portfolio insights PDF:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}

// ========================================
// PDF HTML Template
// ========================================

function generatePortfolioPdfHtml(insights: any, companyName: string): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio Insights Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 11pt;
      opacity: 0.95;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #dbeafe;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
    }
    
    .metric-label {
      font-size: 8.5pt;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .metric-value {
      font-size: 18pt;
      font-weight: 700;
      color: #1f2937;
    }
    
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin-bottom: 20px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    
    th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 600;
      text-align: left;
      padding: 8px;
      border-bottom: 2px solid #d1d5db;
    }
    
    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .insights-list {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 4px;
    }
    
    .insights-list ul {
      list-style: none;
      padding: 0;
    }
    
    .insights-list li {
      padding: 6px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .insights-list li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #f59e0b;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 8.5pt;
      color: #6b7280;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 600;
    }
    
    .badge-blue {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .badge-green {
      background: #dcfce7;
      color: #166534;
    }
    
    .badge-yellow {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge-red {
      background: #fee2e2;
      color: #991b1b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Portfolio Insights Report</h1>
    <p>${companyName} • Generated on ${formatDate(insights.generatedAt)}</p>
  </div>
  
  <!-- High-Level Counts -->
  <div class="section">
    <h2 class="section-title">📊 High-Level Summary</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total RFPs</div>
        <div class="metric-value">${insights.highLevelCounts.totalRfps}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Active RFPs</div>
        <div class="metric-value">${insights.highLevelCounts.activeRfps}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Awarded</div>
        <div class="metric-value">${insights.highLevelCounts.awardedRfps}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Cancelled</div>
        <div class="metric-value">${insights.highLevelCounts.cancelledRfps}</div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Planning</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.highLevelCounts.inPlanning}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Invitation</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.highLevelCounts.inInvitation}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Q&A</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.highLevelCounts.inQA}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Submission</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.highLevelCounts.inSubmission}</div>
      </div>
    </div>
  </div>
  
  <!-- Budget Metrics -->
  <div class="section">
    <h2 class="section-title">💰 Budget Metrics</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Portfolio Value</div>
        <div class="metric-value" style="font-size: 14pt;">${formatCurrency(insights.budgetMetrics.totalBudgetAcrossRfps)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Average Budget</div>
        <div class="metric-value" style="font-size: 14pt;">${formatCurrency(insights.budgetMetrics.averageBudget)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Median Budget</div>
        <div class="metric-value" style="font-size: 14pt;">${formatCurrency(insights.budgetMetrics.medianBudget)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Range</div>
        <div class="metric-value" style="font-size: 10pt;">
          ${insights.budgetMetrics.lowestBudgetRfp ? formatCurrency(insights.budgetMetrics.lowestBudgetRfp.budget) : "N/A"} - ${insights.budgetMetrics.highestBudgetRfp ? formatCurrency(insights.budgetMetrics.highestBudgetRfp.budget) : "N/A"}
        </div>
      </div>
    </div>
  </div>
  
  <!-- Timeline Metrics -->
  <div class="section">
    <h2 class="section-title">⏱️ Timeline & Cycle Time Analysis</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Average Cycle Time</div>
        <div class="metric-value">${insights.timelineMetrics.averageCycleTime} <span style="font-size: 10pt;">days</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Median Cycle Time</div>
        <div class="metric-value">${insights.timelineMetrics.medianCycleTime} <span style="font-size: 10pt;">days</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Shortest</div>
        <div class="metric-value">${insights.timelineMetrics.shortestCycleTime} <span style="font-size: 10pt;">days</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Longest</div>
        <div class="metric-value">${insights.timelineMetrics.longestCycleTime} <span style="font-size: 10pt;">days</span></div>
      </div>
    </div>
  </div>
  
  <!-- Scoring Metrics -->
  ${insights.scoringMetrics.averageSupplierScore !== null ? `
  <div class="section">
    <h2 class="section-title">⭐ Scoring Distribution</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">90-100</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.scoringMetrics.scoreDistribution.range90to100}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">80-89</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.scoringMetrics.scoreDistribution.range80to89}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">70-79</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.scoringMetrics.scoreDistribution.range70to79}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Below 70</div>
        <div class="metric-value" style="font-size: 14pt;">${insights.scoringMetrics.scoreDistribution.range60to69 + insights.scoringMetrics.scoreDistribution.below60}</div>
      </div>
    </div>
    <p style="margin-top: 12px; color: #6b7280; font-size: 9pt;">
      Average Supplier Score: <strong>${insights.scoringMetrics.averageSupplierScore}/100</strong>
      ${insights.scoringMetrics.mustHaveComplianceRate !== null ? ` | Must-Have Compliance: <strong>${insights.scoringMetrics.mustHaveComplianceRate}%</strong>` : ""}
    </p>
  </div>
  ` : ""}
  
  <!-- Supplier Participation -->
  ${insights.supplierParticipation.participationBySupplier.length > 0 ? `
  <div class="section">
    <h2 class="section-title">🏢 Supplier Participation (Top 10)</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th style="text-align: center;">Total RFPs</th>
            <th style="text-align: center;">Shortlisted</th>
            <th style="text-align: center;">Awarded</th>
            <th style="text-align: center;">Declined</th>
          </tr>
        </thead>
        <tbody>
          ${insights.supplierParticipation.participationBySupplier.slice(0, 10).map((s: any) => `
            <tr>
              <td><strong>${s.supplierName}</strong></td>
              <td style="text-align: center;">${s.participationCount}</td>
              <td style="text-align: center;">${s.shortlistedCount}</td>
              <td style="text-align: center;">${s.awardedCount}</td>
              <td style="text-align: center;">${s.declinedCount}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>
  ` : ""}
  
  <!-- Portfolio Insights -->
  ${insights.portfolioInsights.length > 0 ? `
  <div class="section">
    <h2 class="section-title">💡 Key Portfolio Insights</h2>
    <div class="insights-list">
      <ul>
        ${insights.portfolioInsights.map((insight: string) => `<li>${insight}</li>`).join("")}
      </ul>
    </div>
  </div>
  ` : ""}
  
  <div class="footer">
    <p><strong>Fyndr RFP Management System</strong> • Portfolio Insights Dashboard (STEP 44)</p>
    <p style="margin-top: 4px;">Generated on ${formatDate(insights.generatedAt)} for ${companyName}</p>
  </div>
</body>
</html>
  `;
}
