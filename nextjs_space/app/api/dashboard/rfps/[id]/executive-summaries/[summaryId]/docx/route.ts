/**
 * STEP 40.5: Executive Summary DOCX Export API
 * 
 * GET /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/docx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { generateExecutiveSummaryDocx } from '@/lib/executive-summary/executive-summary-docx-generator';

/**
 * GET /api/dashboard/rfps/[id]/executive-summaries/[summaryId]/docx
 * Export a summary as .docx Word document
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

    // Fetch summary
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

    // Prepare data for DOCX generator
    const data = {
      id: summary.id,
      title: summary.title,
      content: summary.content,
      tone: summary.tone,
      audience: summary.audience,
      version: summary.version,
      isOfficial: summary.isOfficial,
      generatedAt: summary.generatedAt?.toISOString() || null,
      autoSaveAt: summary.autoSaveAt?.toISOString() || null,
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
      author: {
        id: summary.author.id,
        name: summary.author.name,
        email: summary.author.email,
      },
      rfpTitle: rfp.title,
      rfpCreatedAt: rfp.createdAt.toISOString(),
    };

    // Generate DOCX buffer
    const buffer = await generateExecutiveSummaryDocx(data);

    // Log activity
    await logActivity({
      eventType: 'EXEC_SUMMARY_EXPORTED_DOCX' as any,
      actorRole: 'BUYER',
      summary: `Executive summary v${summary.version} exported as Word document`,
      userId: session.user.id,
      rfpId,
      details: {
        summaryId: summary.id,
        format: 'docx',
      },
    });

    // Return DOCX file
    const filename = `executive-summary-${rfp.title.replace(/[^a-z0-9]/gi, '-')}-v${summary.version}.docx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting executive summary as DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to export summary as Word document' },
      { status: 500 }
    );
  }
}
