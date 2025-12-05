/**
 * STEP 59: Auto-Scoring Run Endpoint
 * POST /api/dashboard/rfps/[id]/auto-score/run
 * 
 * Runs auto-scoring for a single supplier or all suppliers in an RFP
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scoreSupplierResponse, scoreAllSuppliers } from '@/lib/scoring/auto-scoring-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validate session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Enforce buyer-only access
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden - Only buyers can run auto-scoring' },
        { status: 403 }
      );
    }

    // 3. Get company ID and user ID from session
    const companyId = session.user.companyId;
    const userId = session.user.id;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found in session' },
        { status: 400 }
      );
    }

    // 4. Parse request body
    const body = await req.json();
    const { supplierId } = body;

    const rfpId = params.id;

    // 5. If supplierId present, score single supplier
    if (supplierId) {
      const scores = await scoreSupplierResponse(
        rfpId,
        supplierId,
        companyId,
        userId
      );

      return NextResponse.json({
        success: true,
        message: 'Auto-scoring completed for supplier',
        supplierId,
        scores
      });
    }

    // 6. Otherwise, score all suppliers
    const summary = await scoreAllSuppliers(
      rfpId,
      companyId,
      userId
    );

    return NextResponse.json({
      success: true,
      message: 'Auto-scoring completed for all suppliers',
      summary
    });

  } catch (error) {
    console.error('Error in auto-score run endpoint:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to run auto-scoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
