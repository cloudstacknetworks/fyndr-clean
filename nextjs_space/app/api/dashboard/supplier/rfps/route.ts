/**
 * Step 62: Supplier Portal Enhancements
 * API Route: GET /api/dashboard/supplier/rfps
 * 
 * Returns list of RFPs for the authenticated supplier user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSupplierRFPList } from '@/lib/services/supplier-rfp.service';
import { logActivity, getRequestContext } from '@/lib/activity-log';
import { ACTOR_ROLES } from '@/lib/activity-types';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Role enforcement - must be supplier
    if (session.user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Forbidden. This endpoint is for suppliers only.' },
        { status: 403 }
      );
    }

    // 3. Fetch supplier RFPs
    const rfpList = await getSupplierRFPList(session.user.id);

    // 4. Log activity
    const context = getRequestContext(request);
    logActivity({
      eventType: 'SUPPLIER_RFP_LIST_VIEWED',
      actorRole: ACTOR_ROLES.SUPPLIER,
      summary: `Supplier ${session.user.name || session.user.email} viewed their RFP list`,
      userId: session.user.id,
      details: { rfpCount: rfpList.length },
      ...context
    });

    // 5. Apply optional filters from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const stageFilter = searchParams.get('stage');
    const searchQuery = searchParams.get('search');

    let filteredList = rfpList;

    if (statusFilter && statusFilter !== 'All') {
      filteredList = filteredList.filter((rfp) => rfp.supplierStatus === statusFilter);
    }

    if (stageFilter && stageFilter !== 'All') {
      filteredList = filteredList.filter((rfp) => rfp.stage === stageFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredList = filteredList.filter(
        (rfp) =>
          rfp.title.toLowerCase().includes(query) ||
          rfp.buyerCompanyName.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredList,
      count: filteredList.length
    });
  } catch (error) {
    console.error('[API] Error fetching supplier RFPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RFPs' },
      { status: 500 }
    );
  }
}
