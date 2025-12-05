/**
 * STEP 61: Buyer Evaluation Workspace - Export PDF Endpoint
 * GET /api/dashboard/rfps/[id]/evaluation/[supplierId]/export/pdf
 * 
 * Generates and exports evaluation report as PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getEvaluationWorkspaceData } from '@/lib/evaluation/evaluation-engine';
import { generateEvaluationHtml } from '@/lib/evaluation/evaluation-pdf-generator';
import { generatePdfFromHtml } from '@/lib/export-utils';
import { logActivity } from '@/lib/activity-log';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; supplierId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'supplier') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;
    const userId = session.user.id;

    const workspaceData = await getEvaluationWorkspaceData(rfpId, supplierId, userId);
    const html = generateEvaluationHtml(workspaceData);
    const pdfBuffer = await generatePdfFromHtml(html);

    await logActivity({
      eventType: 'EVALUATION_EXPORTED_PDF',
      summary: `Evaluation exported to PDF for supplier ${supplierId}`,
      userId,
      rfpId,
      actorRole: 'BUYER',
      details: { supplierId }
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="evaluation-${workspaceData.supplier.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Error exporting evaluation PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export evaluation PDF' },
      { status: 500 }
    );
  }
}
