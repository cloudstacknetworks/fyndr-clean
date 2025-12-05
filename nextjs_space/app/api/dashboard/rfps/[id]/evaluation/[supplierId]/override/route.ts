/**
 * STEP 61: Buyer Evaluation Workspace - Override Score Endpoint
 * POST /api/dashboard/rfps/[id]/evaluation/[supplierId]/override
 * 
 * Applies score override for a requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { applyOverrideScore } from '@/lib/evaluation/evaluation-engine';

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
        { error: 'Forbidden: Suppliers cannot override scores' },
        { status: 403 }
      );
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;
    const userId = session.user.id;

    const body = await req.json();
    const { requirementId, score, justification } = body;

    if (!requirementId || score === undefined || !justification) {
      return NextResponse.json(
        { error: 'Missing required fields: requirementId, score, justification' },
        { status: 400 }
      );
    }

    const result = await applyOverrideScore(
      rfpId,
      supplierId,
      requirementId,
      score,
      justification,
      userId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error applying score override:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply score override' },
      { status: error.status || 500 }
    );
  }
}
