/**
 * STEP 59: Auto-Scoring Get Scores Endpoint
 * GET /api/dashboard/rfps/[id]/auto-score/[supplierId]
 * 
 * Fetches auto-scoring results for a specific supplier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; supplierId: string } }
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
        { error: 'Forbidden - Only buyers can view auto-scores' },
        { status: 403 }
      );
    }

    // 3. Get company ID from session
    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found in session' },
        { status: 400 }
      );
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;

    // 4. Fetch RFP and verify company scoping
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: companyId
      }
    });

    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Fetch SupplierResponse for supplierId
    const supplierResponse = await prisma.supplierResponse.findFirst({
      where: {
        rfpId: rfpId,
        supplierContactId: supplierId
      },
      include: {
        supplierContact: {
          select: {
            name: true,
            email: true,
            organization: true
          }
        }
      }
    });

    if (!supplierResponse) {
      return NextResponse.json(
        { error: 'Supplier response not found' },
        { status: 404 }
      );
    }

    // 6. Return autoScoreJson with all scoring details
    return NextResponse.json({
      success: true,
      supplier: {
        id: supplierResponse.supplierContactId,
        name: supplierResponse.supplierContact.name,
        email: supplierResponse.supplierContact.email,
        organization: supplierResponse.supplierContact.organization
      },
      scores: supplierResponse.autoScoreJson,
      generatedAt: supplierResponse.autoScoreGeneratedAt
    });

  } catch (error) {
    console.error('Error in auto-score get endpoint:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch auto-scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
