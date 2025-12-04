// STEP 56: Company-Level RFP Master Template Library API - Single Template Operations
// GET /api/dashboard/templates/[id] - Get template details
// PUT /api/dashboard/templates/[id] - Update template
// DELETE /api/dashboard/templates/[id] - Delete template

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '@/lib/templates/template-library-service';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/dashboard/templates/[id]
 * Get template details with version history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Only buyers can access templates' }, { status: 403 });
    }

    const userId = session.user.id;
    const templateId = params.id;

    // Fetch template
    const template = await getTemplateById(templateId, userId);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('[Template API GET] Error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/templates/[id]
 * Update template metadata and/or content
 * Body:
 * - name: string (optional)
 * - description: string (optional)
 * - visibility: 'company' | 'private' (optional)
 * - category: string (optional)
 * - defaultTimeline: any (optional)
 * - defaultSections: any (optional)
 * - contentJson: any (optional) - creates new version if provided
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Only buyers can update templates' }, { status: 403 });
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;
    const templateId = params.id;

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      visibility,
      category,
      defaultTimeline,
      defaultSections,
      contentJson,
    } = body;

    // Validation
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Template name cannot be empty' }, { status: 400 });
    }

    // Update template
    const template = await updateTemplate(templateId, {
      name: name?.trim(),
      description: description?.trim(),
      visibility,
      category: category?.trim(),
      defaultTimeline,
      defaultSections,
      contentJson,
      updatedByUserId: userId,
    });

    // Log activity
    try {
      const eventType = contentJson 
        ? EVENT_TYPES.TEMPLATE_VERSION_CREATED 
        : EVENT_TYPES.TEMPLATE_UPDATED;

      await logActivityWithRequest(request, {
        eventType,
        actorRole: ACTOR_ROLES.BUYER,
        userId,
        summary: `${session.user.name || session.user.email} updated template "${template.name}"`,
        details: {
          templateId: template.id,
          templateName: template.name,
          hasNewVersion: !!contentJson,
          companyId,
        },
      });
    } catch (logError) {
      console.error('[Template API] Activity logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      template,
      message: contentJson 
        ? 'Template updated and new version created' 
        : 'Template updated successfully',
    });
  } catch (error: any) {
    console.error('[Template API PUT] Error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/templates/[id]
 * Soft delete a template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Only buyers can delete templates' }, { status: 403 });
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;
    const templateId = params.id;

    // Delete template
    const template = await deleteTemplate(templateId, userId);

    // Log activity
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.TEMPLATE_DELETED,
        actorRole: ACTOR_ROLES.BUYER,
        userId,
        summary: `${session.user.name || session.user.email} deleted template "${template.name}"`,
        details: {
          templateId: template.id,
          templateName: template.name,
          companyId,
        },
      });
    } catch (logError) {
      console.error('[Template API] Activity logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('[Template API DELETE] Error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
