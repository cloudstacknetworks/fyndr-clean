/**
 * Step 62: Supplier Portal Enhancements
 * API Route: GET /api/dashboard/supplier/rfps/[id]/preview
 * 
 * Returns submission preview (read-only view of supplier's answers)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSupplierSubmissionPreview } from '@/lib/services/supplier-rfp.service';
import { logActivity, getRequestContext } from '@/lib/activity-log';
import { ACTOR_ROLES } from '@/lib/activity-types';

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

    // 3. Fetch submission preview
    const preview = await getSupplierSubmissionPreview(params.id, session.user.id);

    // 4. Return 404 if not found or not authorized
    if (!preview) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }

    // 5. Log activity
    const context = getRequestContext(request);
    logActivity({
      eventType: 'SUPPLIER_SUBMISSION_PREVIEW_VIEWED',
      actorRole: ACTOR_ROLES.SUPPLIER,
      summary: `Supplier ${session.user.name || session.user.email} viewed submission preview`,
      userId: session.user.id,
      rfpId: params.id,
      details: { rfpTitle: preview.rfpTitle, status: preview.status },
      ...context
    });

    return NextResponse.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('[API] Error fetching supplier submission preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission preview' },
      { status: 500 }
    );
  }
}
