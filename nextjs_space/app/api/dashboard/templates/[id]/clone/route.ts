// STEP 56: Company-Level RFP Master Template Library API - Clone Template
// POST /api/dashboard/templates/[id]/clone - Duplicate a template

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { duplicateTemplate } from '@/lib/templates/template-library-service';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/dashboard/templates/[id]/clone
 * Duplicate a template
 * Body (optional):
 * - name: string (optional) - custom name for the duplicate
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Only buyers can clone templates' }, { status: 403 });
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;
    const templateId = params.id;

    // Parse request body (optional)
    let newName: string | undefined;
    try {
      const body = await request.json();
      newName = body.name;
    } catch {
      // Body is optional for clone
    }

    // Duplicate template
    const template = await duplicateTemplate(
      templateId,
      userId,
      companyId,
      newName
    );

    // Log activity
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.TEMPLATE_CLONED,
        actorRole: ACTOR_ROLES.BUYER,
        userId,
        summary: `${session.user.name || session.user.email} cloned template to "${template.name}"`,
        details: {
          sourceTemplateId: templateId,
          newTemplateId: template.id,
          newTemplateName: template.name,
          companyId,
        },
      });
    } catch (logError) {
      console.error('[Template Clone API] Activity logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Template cloned successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Template Clone API] Error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (error.message === 'Template has no versions') {
      return NextResponse.json({ error: 'Cannot clone template without versions' }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to clone template' },
      { status: 500 }
    );
  }
}
