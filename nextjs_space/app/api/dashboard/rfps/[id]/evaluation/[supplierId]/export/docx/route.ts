/**
 * STEP 61: Buyer Evaluation Workspace - Export DOCX Endpoint
 * GET /api/dashboard/rfps/[id]/evaluation/[supplierId]/export/docx
 * 
 * Generates and exports evaluation report as DOCX
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getEvaluationWorkspaceData } from '@/lib/evaluation/evaluation-engine';
import { generateEvaluationDocx } from '@/lib/evaluation/evaluation-docx-generator';
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
    const docxBuffer = await generateEvaluationDocx(workspaceData);

    await logActivity({
      eventType: 'EVALUATION_EXPORTED_DOCX',
      summary: `Evaluation exported to DOCX for supplier ${supplierId}`,
      userId,
      rfpId,
      actorRole: 'BUYER',
      details: { supplierId }
    });

    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="evaluation-${workspaceData.supplier.name.replace(/[^a-z0-9]/gi, '_')}.docx"`
      }
    });
  } catch (error: any) {
    console.error('Error exporting evaluation DOCX:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export evaluation DOCX' },
      { status: 500 }
    );
  }
}
