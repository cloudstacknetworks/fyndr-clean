/**
 * STEP 40: Executive Summary Save Final API
 * 
 * POST /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/save-final
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

/**
 * POST /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/save-final
 * Mark a summary as the official version
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

    // Verify summary exists
    const existingSummary = await prisma.executiveSummaryDocument.findUnique({
      where: { id: summaryId },
    });

    if (!existingSummary || existingSummary.rfpId !== rfpId) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    // Unmark all other summaries as official for this RFP
    await prisma.executiveSummaryDocument.updateMany({
      where: {
        rfpId,
        isOfficial: true,
      },
      data: {
        isOfficial: false,
      },
    });

    // Mark this summary as official
    const summary = await prisma.executiveSummaryDocument.update({
      where: { id: summaryId },
      data: {
        isOfficial: true,
        updatedAt: new Date(),
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
      eventType: 'EXECUTIVE_SUMMARY_FINALIZED' as any,
      actorRole: 'BUYER',
      summary: `Executive summary v${summary.version} finalized`,
      userId: session.user.id,
      rfpId,
      details: {
        summaryId: summary.id,
        version: summary.version,
      },
    });

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error('Error marking summary as final:', error);
    return NextResponse.json(
      { error: 'Failed to mark summary as final' },
      { status: 500 }
    );
  }
}
