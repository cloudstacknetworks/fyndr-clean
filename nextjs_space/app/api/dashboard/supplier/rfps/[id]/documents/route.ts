/**
 * Step 62: Supplier Portal Enhancements
 * API Route: GET /api/dashboard/supplier/rfps/[id]/documents
 * 
 * Returns documents uploaded by supplier for this RFP
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSupplierDocuments, canSupplierUploadDocuments } from '@/lib/services/supplier-rfp.service';

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

    // 3. Fetch documents
    const documents = await getSupplierDocuments(params.id, session.user.id);

    // 4. Return 404 if not found or not authorized
    if (!documents) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }

    // 5. Check if uploads are allowed
    const canUpload = await canSupplierUploadDocuments(params.id, session.user.id);

    return NextResponse.json({
      success: true,
      data: documents,
      meta: {
        canUpload,
        uploadAllowedMessage: canUpload
          ? 'You can upload documents'
          : 'Upload window is closed or submission already completed'
      }
    });
  } catch (error) {
    console.error('[API] Error fetching supplier documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
