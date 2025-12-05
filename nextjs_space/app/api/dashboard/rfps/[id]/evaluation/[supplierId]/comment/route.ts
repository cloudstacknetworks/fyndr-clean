/**
 * STEP 61: Buyer Evaluation Workspace - Comment Endpoint
 * POST /api/dashboard/rfps/[id]/evaluation/[supplierId]/comment
 * 
 * Saves evaluator comment for a requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { saveEvaluatorComment } from '@/lib/evaluation/evaluation-engine';

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
        { error: 'Forbidden: Suppliers cannot add evaluator comments' },
        { status: 403 }
      );
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;
    const userId = session.user.id;

    const body = await req.json();
    const { requirementId, commentText } = body;

    if (!requirementId || !commentText) {
      return NextResponse.json(
        { error: 'Missing required fields: requirementId, commentText' },
        { status: 400 }
      );
    }

    const result = await saveEvaluatorComment(
      rfpId,
      supplierId,
      requirementId,
      commentText,
      userId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error saving evaluator comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save evaluator comment' },
      { status: error.status || 500 }
    );
  }
}
