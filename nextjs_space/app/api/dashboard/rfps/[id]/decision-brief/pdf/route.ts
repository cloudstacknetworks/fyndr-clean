/**
 * STEP 34: Decision Brief PDF Export Endpoint
 * 
 * GET /api/dashboard/rfps/[id]/decision-brief/pdf
 * 
 * Generates a printable PDF report of the decision brief.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { composeDecisionBriefForRfp, DecisionBriefSnapshot } from '@/lib/decision-brief/composer';
import { generatePdfFromHtml } from '@/lib/export-utils';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden - Buyer access only' }, { status: 403 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { userId: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - Not RFP owner' }, { status: 403 });
    }

    // Generate fresh snapshot
    const snapshot = await composeDecisionBriefForRfp(rfpId, {
      useExistingSnapshotIfFresh: true,
    });

    // Generate HTML for PDF
    const html = generateDecisionBriefHTML(snapshot);

    // Convert to PDF
    const pdfBuffer = await generatePdfFromHtml(html);

    // Log activity
    await logActivityWithRequest(req, {
      userId: session.user.id,
      rfpId,
      eventType: EVENT_TYPES.DECISION_BRIEF_PDF_EXPORTED,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Exported decision brief PDF for RFP: ${snapshot.rfpTitle}`,
      details: {
        rfpId,
        rfpTitle: snapshot.rfpTitle,
        exportFormat: 'PDF',
      },
    });

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="decision-brief-${rfpId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating decision brief PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HTML Template Generation
// ============================================================================

function generateDecisionBriefHTML(snapshot: DecisionBriefSnapshot): string {
  const { coreRecommendation, supplierSummaries, riskSummary, timelineSummary, narrative } = snapshot;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Executive Decision Brief</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      background: white;
    }
    h1 {
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 16pt;
      font-weight: 600;
      color: #374151;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }
    h3 {
      font-size: 12pt;
      font-weight: 600;
      color: #4b5563;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    p, li {
      margin-bottom: 8px;
      color: #374151;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10pt;
    }
    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #111827;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .header h1 {
      color: white;
      border-bottom: none;
      margin-bottom: 4px;
    }
    .header p {
      color: #e0e7ff;
      font-size: 10pt;
    }
    .recommendation {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 16px 0;
    }
    .risk-high { background: #fef2f2; border-left-color: #ef4444; }
    .risk-medium { background: #fffbeb; border-left-color: #f59e0b; }
    .risk-low { background: #f0fdf4; border-left-color: #22c55e; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 600;
    }
    .badge-ready { background: #d1fae5; color: #065f46; }
    .badge-conditional { background: #fef3c7; color: #92400e; }
    .badge-not-ready { background: #fee2e2; color: #991b1b; }
    .badge-risk-high { background: #fee2e2; color: #991b1b; }
    .badge-risk-medium { background: #fef3c7; color: #92400e; }
    .badge-risk-low { background: #d1fae5; color: #065f46; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Executive Decision Brief</h1>
    <p><strong>RFP:</strong> ${escapeHtml(snapshot.rfpTitle)}</p>
    <p><strong>Budget:</strong> ${snapshot.rfpBudget ? `$${snapshot.rfpBudget.toLocaleString()}` : 'N/A'} | <strong>Stage:</strong> ${snapshot.rfpStage} | <strong>Owner:</strong> ${escapeHtml(snapshot.rfpOwnerName || 'N/A')}</p>
    <p><strong>Generated:</strong> ${new Date(snapshot.generatedAt).toLocaleDateString()}</p>
  </div>

  <h2>1. Recommendation</h2>
  <div class="recommendation">
    <h3>${coreRecommendation.recommendationType.replace('_', ' ').toUpperCase()}</h3>
    ${coreRecommendation.recommendedSupplierName ? `<p><strong>Recommended Supplier:</strong> ${escapeHtml(coreRecommendation.recommendedSupplierName)}</p>` : ''}
    <p><strong>Confidence Score:</strong> ${coreRecommendation.confidenceScore}%</p>
    <ul>
      ${coreRecommendation.primaryRationaleBullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
    </ul>
  </div>

  <h2>2. Supplier Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Supplier</th>
        <th>Final Score</th>
        <th>Readiness</th>
        <th>Pricing</th>
        <th>Speed</th>
        <th>Risk</th>
      </tr>
    </thead>
    <tbody>
      ${supplierSummaries.map(s => `
        <tr>
          <td><strong>${escapeHtml(s.supplierName)}</strong><br/><small>${escapeHtml(s.organization || 'N/A')}</small></td>
          <td>${s.finalScore || 'N/A'}</td>
          <td><span class="badge badge-${getReadinessBadgeClass(s.readinessTier)}">${s.readinessTier || 'N/A'}</span></td>
          <td>${s.pricingPosition || 'N/A'}</td>
          <td>${s.submissionSpeedDays !== null ? `${s.submissionSpeedDays} days` : 'N/A'}</td>
          <td><span class="badge badge-risk-${s.headlineRiskLevel}">${s.headlineRiskLevel}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>3. Risk & Mitigation</h2>
  <div class="recommendation risk-${riskSummary.overallRiskLevel}">
    <p><strong>Overall Risk Level:</strong> ${riskSummary.overallRiskLevel.toUpperCase()}</p>
    <h3>Key Risks:</h3>
    <ul>
      ${riskSummary.keyRisks.length > 0 ? riskSummary.keyRisks.map(r => `<li>${escapeHtml(r)}</li>`).join('') : '<li>No significant risks identified</li>'}
    </ul>
    <h3>Mitigation Actions:</h3>
    <ul>
      ${riskSummary.mitigationActions.length > 0 ? riskSummary.mitigationActions.map(m => `<li>${escapeHtml(m)}</li>`).join('') : '<li>No mitigation actions required</li>'}
    </ul>
  </div>

  <h2>4. Timeline & Next Steps</h2>
  <p><strong>Current Stage:</strong> ${timelineSummary.currentStage}</p>
  <h3>Upcoming Milestones:</h3>
  <ul>
    ${timelineSummary.upcomingMilestones.length > 0 ? timelineSummary.upcomingMilestones.map(m => `
      <li><strong>${m.label}:</strong> ${m.date ? new Date(m.date).toLocaleDateString() : 'Not set'} ${m.daysRemaining !== null ? `(${m.daysRemaining} days)` : ''}</li>
    `).join('') : '<li>No upcoming milestones</li>'}
  </ul>
  <h3>Suggested Next Steps:</h3>
  <ul>
    ${timelineSummary.suggestedNextSteps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
  </ul>

  <h2>5. Executive Narrative</h2>
  <p>${escapeHtml(narrative.executiveSummary)}</p>

  <div class="footer">
    <p>This report was generated by the Fyndr RFP Management System. For detailed analysis and interactive views, please refer to the platform dashboard.</p>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string | null): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getReadinessBadgeClass(tier: string | null): string {
  if (!tier) return 'not-ready';
  if (tier === 'Ready') return 'ready';
  if (tier === 'Conditional') return 'conditional';
  return 'not-ready';
}
