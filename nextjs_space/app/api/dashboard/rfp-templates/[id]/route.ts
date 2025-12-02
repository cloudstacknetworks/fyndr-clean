/**
 * STEP 38A: RFP Templates API - Get template details
 * 
 * Endpoint: GET /api/dashboard/rfp-templates/[id]
 * Purpose: Fetch detailed information for a specific template
 * Security: Buyer-only access
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { loadTemplate } from '@/lib/rfp-templates/template-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = params.id;

    // Load the template
    const template = await loadTemplate(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found or is inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      template,
    });
  } catch (error) {
    console.error('[GET /api/dashboard/rfp-templates/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
