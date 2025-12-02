/**
 * STEP 40: Executive Summary Autosave API
 * 
 * POST /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/autosave
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { sanitizeHTMLContent } from '@/lib/executive-summary/composer';

/**
 * POST /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/autosave
 * Autosave edited content without creating a new version
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
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

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

    // Sanitize and update content
    const sanitizedContent = sanitizeHTMLContent(content);

    const summary = await prisma.executiveSummaryDocument.update({
      where: { id: summaryId },
      data: {
        content: sanitizedContent,
        autoSaveAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      autoSaveAt: summary.autoSaveAt 
    }, { status: 200 });
  } catch (error) {
    console.error('Error autosaving executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to autosave' },
      { status: 500 }
    );
  }
}
