/**
 * STEP 63: Export Execution API Endpoint
 * POST /api/dashboard/export/execute
 * 
 * Executes an export by routing to existing export endpoints.
 * Buyer-only access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { executeExport, validateExportParams } from '@/lib/exports/export-execution';

export async function POST(req: NextRequest) {
  try {
    // 1. Validate session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }
    
    // 2. Validate buyer role
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden - buyer role required' },
        { status: 403 }
      );
    }
    
    // 3. Parse request body
    const body = await req.json();
    const {
      exportId,
      rfpId,
      supplierId,
      summaryId,
      supplierContactId,
      queryParams
    } = body;
    
    if (!exportId) {
      return NextResponse.json(
        { error: 'Export ID is required' },
        { status: 400 }
      );
    }
    
    // 4. Validate export parameters
    const validation = validateExportParams(exportId, {
      rfpId,
      supplierId,
      summaryId,
      supplierContactId,
      queryParams
    });
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // 5. Execute export
    const result = await executeExport(
      exportId,
      {
        rfpId,
        supplierId,
        summaryId,
        supplierContactId,
        queryParams
      },
      session
    );
    
    // 6. Return result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Export failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      filename: result.filename,
      contentType: result.contentType,
      data: result.data, // base64
      exportId: result.exportId,
      timestamp: result.timestamp,
      rfpId: result.rfpId,
      supplierId: result.supplierId,
      durationMs: result.durationMs,
      fileSize: result.fileSize
    });
    
  } catch (error: any) {
    console.error('Export execution API error:', error);
    return NextResponse.json(
      { error: error.message || 'Export execution failed' },
      { status: 500 }
    );
  }
}
