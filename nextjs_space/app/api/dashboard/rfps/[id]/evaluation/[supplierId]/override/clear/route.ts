/**
 * STEP 61: Buyer Evaluation Workspace - Clear Override Endpoint
 * POST /api/dashboard/rfps/[id]/evaluation/[supplierId]/override/clear
 * 
 * Clears score override for a requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { clearOverrideScore } from '@/lib/evaluation/evaluation-engine';

export async function POST(
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
        { error: 'Forbidden: Suppliers cannot clear overrides' },
        { status: 403 }
      );
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;
    const userId = session.user.id;

    const body = await req.json();
    const { requirementId } = body;

    if (!requirementId) {
      return NextResponse.json(
        { error: 'Missing required field: requirementId' },
        { status: 400 }
      );
    }

    const result = await clearOverrideScore(rfpId, supplierId, requirementId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error clearing score override:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear score override' },
      { status: error.status || 500 }
    );
  }
}
