/**
 * STEP 40: Executive Summary Clone API
 * 
 * POST /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/clone
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

/**
 * POST /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/clone
 * Clone an existing summary to create a new editable version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; summaryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rfpId, summaryId } = params;

    // Verify RFP access
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        userId: session.user.id,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Fetch the original summary
    const originalSummary = await prisma.executiveSummaryDocument.findUnique({
      where: { id: summaryId },
    });

    if (!originalSummary || originalSummary.rfpId !== rfpId) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    // Get the next version number
    const latestSummary = await prisma.executiveSummaryDocument.findFirst({
      where: { rfpId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestSummary?.version || 0) + 1;

    // Clone the summary
    const clonedSummary = await prisma.executiveSummaryDocument.create({
      data: {
        rfpId,
        authorId: session.user.id,
        title: `${originalSummary.title} (Copy)`,
        content: originalSummary.content,
        tone: originalSummary.tone,
        audience: originalSummary.audience,
        version: nextVersion,
        isOfficial: false,
        clonedFromId: summaryId,
        generatedAt: null, // Cloned summaries are not AI-generated
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await logActivity({
      eventType: 'EXECUTIVE_SUMMARY_CLONED' as any,
      actorRole: 'BUYER',
      summary: `Executive summary cloned from v${originalSummary.version}`,
      userId: session.user.id,
      rfpId,
      details: {
        summaryId: clonedSummary.id,
        originalSummaryId: summaryId,
        version: clonedSummary.version,
      },
    });

    return NextResponse.json({ summary: clonedSummary }, { status: 201 });
  } catch (error) {
    console.error('Error cloning executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to clone summary' },
      { status: 500 }
    );
  }
}
