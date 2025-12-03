/**
 * STEP 46: AI-Powered Executive Summary Comparison API
 * 
 * POST /api/dashboard/rfps/[id]/executive-summaries/compare
 * - Compares two Executive Summary versions
 * - Returns JSON comparison result
 * - Logs EXEC_SUMMARY_COMPARED activity
 * - Buyer-only, company-scoped
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { compareExecutiveSummaries } from '@/lib/executive-summary/summary-compare-engine';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

export async function POST(
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
    // PARSE REQUEST BODY
    // ========================================================================
    const body = await req.json();
    const { summaryAId, summaryBId } = body;

    if (!summaryAId || !summaryBId) {
      return NextResponse.json(
        { error: 'Missing required fields: summaryAId and summaryBId' },
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
    // ACTIVITY LOGGING
    // ========================================================================
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.EXEC_SUMMARY_COMPARED,
      actorRole: ACTOR_ROLES.BUYER,
      userId: session.user.id,
      rfpId: rfpId,
      summary: `Compared Executive Summary v${summaryA.version} vs v${summaryB.version}`,
      details: {
        rfpId,
        rfpTitle: rfp.title,
        summaryAId,
        summaryBId,
        versionA: summaryA.version,
        versionB: summaryB.version,
        overallChangeScore: comparison.scoring.overallChangeScore,
      },
    });

    // ========================================================================
    // RETURN RESULT
    // ========================================================================
    return NextResponse.json({
      success: true,
      comparison,
    });

  } catch (error) {
    console.error('Error comparing executive summaries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
