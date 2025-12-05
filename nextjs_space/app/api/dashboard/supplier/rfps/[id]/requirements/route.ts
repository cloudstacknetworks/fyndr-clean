/**
 * Step 62: Supplier Portal Enhancements
 * API Route: GET /api/dashboard/supplier/rfps/[id]/requirements
 * 
 * Returns requirements list for supplier (no scores, no internal metadata)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSupplierRequirements } from '@/lib/services/supplier-rfp.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Role enforcement
    if (session.user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Forbidden. This endpoint is for suppliers only.' },
        { status: 403 }
      );
    }

    // 3. Fetch requirements
    const requirements = await getSupplierRequirements(params.id, session.user.id);

    // 4. Return 404 if not found or not authorized
    if (!requirements) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('[API] Error fetching supplier requirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requirements' },
      { status: 500 }
    );
  }
}
