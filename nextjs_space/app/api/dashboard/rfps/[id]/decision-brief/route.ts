/**
 * STEP 34: Decision Brief JSON Snapshot Endpoint
 * 
 * GET /api/dashboard/rfps/[id]/decision-brief
 * 
 * Returns the decision brief snapshot as JSON, using cached data if fresh.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { composeDecisionBriefForRfp } from '@/lib/decision-brief/composer';

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
      select: { userId: true, decisionBriefMeta: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - Not RFP owner' }, { status: 403 });
    }

    // Generate snapshot (with caching)
    const snapshot = await composeDecisionBriefForRfp(rfpId, {
      useExistingSnapshotIfFresh: true,
      freshnessThresholdMinutes: 60,
    });

    // Determine metadata
    const meta = rfp.decisionBriefMeta as any;
    const hasAiNarrative = meta?.generatedUsingAI || false;
    const lastGeneratedAt = meta?.lastGeneratedAt || null;
    const version = meta?.version || 0;
    const canGenerateAI = !!process.env.OPENAI_API_KEY;

    return NextResponse.json({
      snapshot,
      meta: {
        canGenerateAI,
        hasAiNarrative,
        lastGeneratedAt,
        version,
      },
    });
  } catch (error) {
    console.error('Error fetching decision brief:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
