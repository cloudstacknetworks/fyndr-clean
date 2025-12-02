/**
 * STEP 40: Executive Summary API Routes
 * 
 * GET /api/dashboard/rfps/[id]/executive-summaries - List all summaries for an RFP
 * POST /api/dashboard/rfps/[id]/executive-summaries/generate - Generate new summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { generateExecutiveSummary, type ToneType, type AudienceType } from '@/lib/executive-summary/composer';
import { logActivity } from '@/lib/activity-log';

/**
 * GET /api/dashboard/rfps/[id]/executive-summaries
 * List all executive summaries for an RFP
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rfpId = params.id;

    // Verify RFP exists and user has access
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        userId: session.user.id,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Fetch all executive summaries for this RFP
    const summaries = await prisma.executiveSummaryDocument.findMany({
      where: { rfpId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isOfficial: 'desc' }, // Official versions first
        { version: 'desc' },    // Then by version
        { createdAt: 'desc' },  // Then by creation date
      ],
    });

    return NextResponse.json({ summaries }, { status: 200 });
  } catch (error) {
    console.error('Error fetching executive summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executive summaries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/rfps/[id]/executive-summaries/generate
 * Generate a new executive summary using AI
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rfpId = params.id;
    const body = await request.json();
    const { tone = 'professional', audience = 'executive', title = 'Executive Summary' } = body;

    // Verify RFP exists and user has access (buyer only)
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        userId: session.user.id,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Generate summary using OpenAI
    const content = await generateExecutiveSummary(prisma, {
      rfpId,
      tone: tone as ToneType,
      audience: audience as AudienceType,
      userId: session.user.id,
    });

    // Get the next version number
    const latestSummary = await prisma.executiveSummaryDocument.findFirst({
      where: { rfpId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestSummary?.version || 0) + 1;

    // Create new summary document
    const summary = await prisma.executiveSummaryDocument.create({
      data: {
        rfpId,
        authorId: session.user.id,
        title,
        content,
        tone,
        audience,
        version: nextVersion,
        isOfficial: false,
        generatedAt: new Date(),
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
      eventType: 'EXECUTIVE_SUMMARY_GENERATED' as any,
      actorRole: 'BUYER',
      summary: `Executive summary v${summary.version} generated`,
      userId: session.user.id,
      rfpId,
      details: {
        summaryId: summary.id,
        version: summary.version,
        tone,
        audience,
      },
    });

    return NextResponse.json({ summary }, { status: 201 });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate executive summary' },
      { status: 500 }
    );
  }
}
