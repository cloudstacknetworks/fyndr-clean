/**
 * STEP 46: Executive Summary Comparison DOCX Export
 * 
 * GET /api/dashboard/rfps/[id]/executive-summaries/compare/docx?summaryAId=x&summaryBId=y
 * - Generates DOCX comparison report
 * - Returns DOCX file download
 * - Logs EXEC_SUMMARY_COMPARED_EXPORTED activity
 * - Buyer-only, company-scoped
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { compareExecutiveSummaries } from '@/lib/executive-summary/summary-compare-engine';
import { generateComparisonDocx } from '@/lib/executive-summary/summary-compare-docx-generator';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ========================================================================
    // AUTHORIZATION - BUYER ONLY
    // ========================================================================
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden: Buyer access only' },
        { status: 403 }
      );
    }

    const rfpId = params.id;

    // Verify RFP exists and user owns it
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { id: true, userId: true, title: true },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this RFP' },
        { status: 403 }
      );
    }

    // ========================================================================
    // PARSE QUERY PARAMETERS
    // ========================================================================
    const { searchParams } = new URL(req.url);
    const summaryAId = searchParams.get('summaryAId');
    const summaryBId = searchParams.get('summaryBId');

    if (!summaryAId || !summaryBId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: summaryAId and summaryBId' },
        { status: 400 }
      );
    }

    if (summaryAId === summaryBId) {
      return NextResponse.json(
        { error: 'Cannot compare a summary with itself' },
        { status: 400 }
      );
    }

    // ========================================================================
    // FETCH BOTH SUMMARIES
    // ========================================================================
    const [summaryA, summaryB] = await Promise.all([
      prisma.executiveSummaryDocument.findUnique({
        where: { id: summaryAId },
      }),
      prisma.executiveSummaryDocument.findUnique({
        where: { id: summaryBId },
      }),
    ]);

    if (!summaryA || !summaryB) {
      return NextResponse.json(
        { error: 'One or both summaries not found' },
        { status: 404 }
      );
    }

    // Verify both summaries belong to the same RFP
    if (summaryA.rfpId !== rfpId || summaryB.rfpId !== rfpId) {
      return NextResponse.json(
        { error: 'Summaries must belong to the specified RFP' },
        { status: 400 }
      );
    }

    // ========================================================================
    // EXECUTE COMPARISON
    // ========================================================================
    const comparison = await compareExecutiveSummaries(summaryA, summaryB);

    // ========================================================================
    // GENERATE DOCX
    // ========================================================================
    const docxBuffer = await generateComparisonDocx({
      comparison,
      rfpTitle: rfp.title,
      versionA: summaryA.version,
      versionB: summaryB.version,
    });

    // ========================================================================
    // ACTIVITY LOGGING
    // ========================================================================
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.EXEC_SUMMARY_COMPARED_EXPORTED,
      actorRole: ACTOR_ROLES.BUYER,
      userId: session.user.id,
      rfpId: rfpId,
      summary: `Exported comparison DOCX: Executive Summary v${summaryA.version} vs v${summaryB.version}`,
      details: {
        rfpId,
        rfpTitle: rfp.title,
        summaryAId,
        summaryBId,
        versionA: summaryA.version,
        versionB: summaryB.version,
        format: 'docx',
      },
    });

    // ========================================================================
    // RETURN DOCX
    // ========================================================================
    const fileName = `Executive_Summary_Comparison_v${summaryA.version}_vs_v${summaryB.version}.docx`;
    
    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error generating comparison DOCX:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
