import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { notifyUserForEvent } from '@/lib/notifications';
import { COMPARISON_REPORT_READY } from '@/lib/notification-types';

const prisma = new PrismaClient();

/**
 * POST /api/rfps/[id]/compare/report
 * 
 * Generates board-ready decision report in HTML and PDF formats
 * Requires buyer role and RFP ownership
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify buyer role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyer access only' }, { status: 403 });
    }

    const rfpId = params.id;

    // Load RFP with narrative
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        company: { select: { name: true } },
        supplier: { select: { name: true } },
        evaluationMatrix: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Verify ownership
    if (rfp.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Not RFP owner' }, { status: 403 });
    }

    // Check if narrative exists
    if (!rfp.comparisonNarrative) {
      return NextResponse.json(
        { error: 'Please generate narrative first before creating report' },
        { status: 400 }
      );
    }

    const narrative = rfp.comparisonNarrative as any;

    // Load supplier responses with comparison data
    const supplierResponses = await prisma.supplierResponse.findMany({
      where: {
        rfpId,
        status: 'SUBMITTED',
        comparisonScore: { not: null },
      },
      include: {
        supplierContact: {
          select: {
            name: true,
            email: true,
            organization: true,
          },
        },
      },
      orderBy: {
        comparisonScore: 'desc',
      },
    });

    // Generate HTML report
    const html = generateReportHtml(rfp, narrative, supplierResponses);

    // Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `${rfpId}-comparison-report.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Save report URL to RFP
    const reportUrl = `/uploads/reports/${fileName}`;
    await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        comparisonReportUrl: reportUrl,
      },
    });

    // STEP 22: Send notification to buyer about report ready
    try {
      const buyer = await prisma.user.findUnique({
        where: { id: rfp.userId },
      });

      if (buyer) {
        await notifyUserForEvent(COMPARISON_REPORT_READY, buyer, {
          rfpId: rfp.id,
          rfpTitle: rfp.title,
        });
      }
    } catch (notifError) {
      console.error('Error sending report ready notification:', notifError);
      // Don't fail the report generation if notification fails
    }

    return NextResponse.json({
      success: true,
      reportUrl,
      html,
      message: 'Report generated successfully',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate professional HTML report
 */
function generateReportHtml(rfp: any, narrative: any, suppliers: any[]): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const matrixUsed = rfp.evaluationMatrix?.name || 'Default Weights';

  // Helper to get ranking badge color
  const getRankingColor = (index: number, total: number) => {
    if (index === 0) return 'background: #10b981; color: white;'; // Green
    if (index === total - 1) return 'background: #ef4444; color: white;'; // Red
    return 'background: #f59e0b; color: white;'; // Amber
  };

  // Helper to format score badge
  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'background: #10b981; color: white;';
    if (score >= 50) return 'background: #f59e0b; color: white;';
    return 'background: #ef4444; color: white;';
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supplier Comparison Report - ${escapeHtml(rfp.title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    /* Cover Page */
    .cover-page {
      text-align: center;
      padding: 100px 20px;
      page-break-after: always;
    }
    
    .cover-logo {
      font-size: 48px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 40px;
    }
    
    .cover-title {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .cover-subtitle {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 60px;
    }
    
    .cover-rfp-title {
      font-size: 24px;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 10px;
    }
    
    .cover-date {
      font-size: 14px;
      color: #9ca3af;
    }
    
    /* Header */
    .header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .page-title {
      font-size: 14px;
      color: #6b7280;
    }
    
    .page-number {
      font-size: 12px;
      color: #9ca3af;
    }
    
    /* Sections */
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .section-content {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.8;
    }
    
    /* Executive Summary */
    .executive-summary {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      padding: 30px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      margin-bottom: 40px;
    }
    
    /* Comparison Table */
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .comparison-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .comparison-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .comparison-table tr:hover {
      background: #f9fafb;
    }
    
    /* Score Badge */
    .score-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }
    
    /* Ranking Badge */
    .ranking-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
    }
    
    /* Strengths List */
    .strengths-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    
    .supplier-strengths {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }
    
    .supplier-name {
      font-weight: 700;
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .strengths-list {
      list-style: none;
      padding-left: 0;
    }
    
    .strengths-list li {
      padding: 6px 0;
      padding-left: 20px;
      position: relative;
      font-size: 14px;
      color: #4b5563;
    }
    
    .strengths-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
    }
    
    /* Recommendation Box */
    .recommendation-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 30px;
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .recommendation-title {
      font-size: 20px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 15px;
    }
    
    .recommendation-content {
      font-size: 15px;
      color: #78350f;
      line-height: 1.8;
    }
    
    /* Footer */
    .footer {
      border-top: 2px solid #e5e7eb;
      padding-top: 20px;
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    
    /* Print Styles */
    @media print {
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-logo">Fyndr</div>
    <div class="cover-title">Supplier Comparison Decision Report</div>
    <div class="cover-subtitle">Enterprise RFP Analysis & Recommendation</div>
    <div class="cover-rfp-title">${escapeHtml(rfp.title)}</div>
    <div class="cover-date">Generated on ${today}</div>
  </div>

  <!-- Main Content -->
  <div class="container">
    <!-- Executive Summary -->
    <div class="section executive-summary">
      <h2 class="section-title">Executive Summary</h2>
      <div class="section-content">
        ${escapeHtml(narrative.overview || 'No overview available')}
      </div>
    </div>

    <!-- Comparison Score Table -->
    <div class="section page-break">
      <h2 class="section-title">Supplier Comparison Scores</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Supplier</th>
            <th>Organization</th>
            <th>Final Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${suppliers
            .map(
              (supplier, index) => `
            <tr>
              <td>
                <span class="ranking-badge" style="${getRankingColor(index, suppliers.length)}">
                  #${index + 1}
                </span>
              </td>
              <td><strong>${escapeHtml(supplier.supplierContact.name || 'Unnamed')}</strong></td>
              <td>${escapeHtml(supplier.supplierContact.organization || 'N/A')}</td>
              <td>
                <span class="score-badge" style="${getScoreBadge(supplier.comparisonScore || 0)}">
                  ${supplier.comparisonScore || 0}/100
                </span>
              </td>
              <td>${index === 0 ? '⭐ Top Choice' : index === suppliers.length - 1 ? '⚠️ Lowest Score' : '✓ Competitive'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <p style="margin-top: 15px; font-size: 13px; color: #6b7280;">
        <strong>Evaluation Method:</strong> ${escapeHtml(matrixUsed)}
      </p>
    </div>

    <!-- Supplier Strengths -->
    <div class="section page-break">
      <h2 class="section-title">Supplier Strengths</h2>
      <div class="strengths-grid">
        ${Object.entries(narrative.strengths || {})
          .map(
            ([supplier, strengths]: [string, any]) => `
          <div class="supplier-strengths">
            <div class="supplier-name">${escapeHtml(supplier)}</div>
            <ul class="strengths-list">
              ${Array.isArray(strengths) ? strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join('') : '<li>No strengths listed</li>'}
            </ul>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Requirements Coverage -->
    <div class="section">
      <h2 class="section-title">Requirements Coverage Comparison</h2>
      <div class="section-content">
        ${escapeHtml(narrative.requirementsComparison || 'No requirements comparison available')}
      </div>
    </div>

    <!-- Pricing Comparison -->
    <div class="section">
      <h2 class="section-title">Pricing Competitiveness</h2>
      <div class="section-content">
        ${escapeHtml(narrative.pricingComparison || 'No pricing comparison available')}
      </div>
    </div>

    <!-- Risks Comparison -->
    <div class="section">
      <h2 class="section-title">Key Risks & Mitigations</h2>
      <div class="section-content">
        ${escapeHtml(narrative.risksComparison || 'No risk comparison available')}
      </div>
    </div>

    <!-- Differentiators -->
    <div class="section">
      <h2 class="section-title">Supplier Differentiators</h2>
      <div class="section-content">
        ${escapeHtml(narrative.differentiatorsComparison || 'No differentiators comparison available')}
      </div>
    </div>

    <!-- Demo Summary -->
    <div class="section">
      <h2 class="section-title">Demo & Presentation Analysis</h2>
      <div class="section-content">
        ${escapeHtml(narrative.demoComparison || 'No demo comparison available')}
      </div>
    </div>

    <!-- Final Recommendation -->
    <div class="recommendation-box page-break">
      <div class="recommendation-title">📋 Final Recommendation</div>
      <div class="recommendation-content">
        ${escapeHtml(narrative.recommendation || 'No recommendation available')}
      </div>
    </div>

    <!-- Tie-breaker Analysis (if applicable) -->
    ${
      narrative.tieBreaker
        ? `
    <div class="section">
      <h2 class="section-title">Tie-break Analysis</h2>
      <div class="section-content" style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        ${escapeHtml(narrative.tieBreaker)}
      </div>
    </div>
    `
        : ''
    }

    <!-- Footer -->
    <div class="footer">
      <p><strong>Generated by Fyndr</strong> - ${today}</p>
      <p>Confidential and Proprietary Information</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
