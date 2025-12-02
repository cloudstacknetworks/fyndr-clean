/**
 * STEP 38A: RFP Templates API - Apply template to RFP
 * 
 * Endpoint: POST /api/dashboard/rfp-templates/apply
 * Purpose: Apply a selected template to an existing RFP
 * Security: Buyer-only access, RFP ownership validation
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { applyTemplateToRfp } from '@/lib/rfp-templates/template-engine';

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Buyer-only access
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden: Buyer access only' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { rfpId, templateId } = body;

    if (!rfpId || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields: rfpId and templateId' },
        { status: 400 }
      );
    }

    // Apply the template to the RFP
    const result = await applyTemplateToRfp(
      rfpId,
      templateId,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      rfp: result.rfp,
      message: result.message,
    });
  } catch (error) {
    console.error('[POST /api/dashboard/rfp-templates/apply] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
