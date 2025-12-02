/**
 * STEP 38A: RFP Templates API - GET all templates
 * 
 * Endpoint: GET /api/dashboard/rfp-templates
 * Purpose: Fetch all available templates and categories for the template selection UI
 * Security: Buyer-only access
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAvailableTemplates } from '@/lib/rfp-templates/template-engine';

export async function GET(req: NextRequest) {
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

    // Fetch all available templates and categories
    const { categories, templates } = await getAvailableTemplates();

    return NextResponse.json({
      categories,
      templates,
    });
  } catch (error) {
    console.error('[GET /api/dashboard/rfp-templates] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
