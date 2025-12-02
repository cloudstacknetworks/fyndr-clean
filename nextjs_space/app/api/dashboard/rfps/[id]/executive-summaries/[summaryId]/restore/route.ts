import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

/**
 * POST /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/restore
 * 
 * Restore a previous version as a new version.
 * Creates a new ExecutiveSummaryDocument with content copied from the source summary.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; summaryId: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Authorization: Supplier role check
    if (session.user.role === "SUPPLIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: rfpId, summaryId } = params;

    // Validate summary belongs to RFP in buyer's company
    const summary = await prisma.executiveSummaryDocument.findFirst({
      where: {
        id: summaryId,
        rfp: {
          id: rfpId,
          userId: session.user.id
        }
      },
      include: { rfp: true }
    });

    if (!summary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

    // Get max version number for this RFP + audience combination
    const maxVersion = await prisma.executiveSummaryDocument.findFirst({
      where: {
        rfpId: rfpId,
        audience: summary.audience
      },
      orderBy: {
        version: 'desc'
      },
      select: {
        version: true
      }
    });

    const newVersion = (maxVersion?.version || 0) + 1;

    // Create new summary document
    const restoredSummary = await prisma.executiveSummaryDocument.create({
      data: {
        rfpId: rfpId,
        title: summary.title,
        audience: summary.audience,
        tone: summary.tone,
        content: summary.content,
        version: newVersion,
        isOfficial: false, // Restored versions start as drafts
        authorId: session.user.id,
        clonedFromId: summaryId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity event
    await logActivityWithRequest(request, {
      eventType: EVENT_TYPES.EXECUTIVE_SUMMARY_CLONED, // Using CLONED event for restore
      actorRole: ACTOR_ROLES.BUYER,
      userId: session.user.id,
      rfpId: rfpId,
      summary: `Version ${summary.version} restored as version ${newVersion}`,
      details: {
        sourceVersionNumber: summary.version,
        newVersionNumber: newVersion,
        sourceSummaryId: summaryId,
        newSummaryId: restoredSummary.id,
        audience: summary.audience,
        tone: summary.tone
      }
    });

    return NextResponse.json({
      summary: {
        id: restoredSummary.id,
        title: restoredSummary.title,
        audience: restoredSummary.audience,
        tone: restoredSummary.tone,
        version: restoredSummary.version,
        isOfficial: restoredSummary.isOfficial,
        content: restoredSummary.content,
        createdAt: restoredSummary.createdAt,
        updatedAt: restoredSummary.updatedAt,
        author: restoredSummary.author
      },
      message: `Version ${summary.version} restored as version ${newVersion}`
    });

  } catch (error) {
    console.error('[Restore Summary Error]', error);
    return NextResponse.json(
      { error: "Failed to restore summary" },
      { status: 500 }
    );
  }
}
