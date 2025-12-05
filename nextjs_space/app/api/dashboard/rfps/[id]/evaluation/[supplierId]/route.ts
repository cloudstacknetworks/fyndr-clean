/**
 * STEP 61: Buyer Evaluation Workspace - Main Endpoint
 * GET /api/dashboard/rfps/[id]/evaluation/[supplierId]
 * 
 * Loads complete evaluation workspace data for a supplier's response
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getEvaluationWorkspaceData } from '@/lib/evaluation/evaluation-engine';
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

    // Enforce buyer-only access
    if (session.user.role === 'supplier') {
      return NextResponse.json(
        { error: 'Forbidden: Suppliers cannot access evaluation workspace' },
        { status: 403 }
      );
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;
    const userId = session.user.id;

    const workspaceData = await getEvaluationWorkspaceData(rfpId, supplierId, userId);

    // Log activity
    await logActivity({
      eventType: 'EVALUATION_VIEWED',
      summary: `Evaluation workspace viewed for supplier ${supplierId}`,
      userId,
      rfpId,
      actorRole: 'BUYER',
      details: { supplierId }
    });

    return NextResponse.json(workspaceData);
  } catch (error: any) {
    console.error('Error loading evaluation workspace:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load evaluation workspace' },
      { status: error.status || 500 }
    );
  }
}
