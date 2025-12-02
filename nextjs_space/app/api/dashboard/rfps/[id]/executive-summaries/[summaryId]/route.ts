/**
 * STEP 40: Executive Summary [summaryId] API Routes
 * 
 * GET /api/dashboard/rfps/[id]/executive-summaries/[summaryId] - Get specific summary
 * PATCH /api/dashboard/rfps/[id]/executive-summaries/[summaryId] - Update summary content
 * DELETE /api/dashboard/rfps/[id]/executive-summaries/[summaryId] - Delete summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { sanitizeHTMLContent } from '@/lib/executive-summary/composer';

/**
 * GET /api/dashboard/rfps/[id]/executive-summaries/[summaryId]
 * Get a specific executive summary
 */
export async function GET(
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

    // Fetch specific summary
    const summary = await prisma.executiveSummaryDocument.findUnique({
      where: { id: summaryId },
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

    if (!summary || summary.rfpId !== rfpId) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error('Error fetching executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executive summary' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/rfps/[id]/executive-summaries/[summaryId]
 * Update summary content (for manual edits)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; summaryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rfpId, summaryId } = params;
    const body = await request.json();
    const { content, title } = body;

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

    // Sanitize content
    const sanitizedContent = content ? sanitizeHTMLContent(content) : existingSummary.content;

    // Update summary
    const summary = await prisma.executiveSummaryDocument.update({
      where: { id: summaryId },
      data: {
        content: sanitizedContent,
        title: title || existingSummary.title,
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
      eventType: 'EXECUTIVE_SUMMARY_EDITED' as any,
      actorRole: 'BUYER',
      summary: `Executive summary v${summary.version} edited`,
      userId: session.user.id,
      rfpId,
      details: {
        summaryId: summary.id,
        version: summary.version,
      },
    });

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error('Error updating executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to update executive summary' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/rfps/[id]/executive-summaries/[summaryId]
 * Delete a summary
 */
export async function DELETE(
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
    const summary = await prisma.executiveSummaryDocument.findUnique({
      where: { id: summaryId },
    });

    if (!summary || summary.rfpId !== rfpId) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    // Delete summary
    await prisma.executiveSummaryDocument.delete({
      where: { id: summaryId },
    });

    // Log activity
    await logActivity({
      eventType: 'EXECUTIVE_SUMMARY_DELETED' as any,
      actorRole: 'BUYER',
      summary: `Executive summary v${summary.version} deleted`,
      userId: session.user.id,
      rfpId,
      details: {
        summaryId,
        version: summary.version,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to delete executive summary' },
      { status: 500 }
    );
  }
}
