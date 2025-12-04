// STEP 56: Company-Level RFP Master Template Library API
// GET /api/dashboard/templates - List templates
// POST /api/dashboard/templates - Create new template

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTemplates, createTemplate } from '@/lib/templates/template-library-service';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

/**
 * GET /api/dashboard/templates
 * List all templates for the user's company
 * Query params:
 * - category: string (optional)
 * - visibility: 'company' | 'private' (optional)
 */
export async function GET(request: NextRequest) {
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
    const companyId = session.user.companyId;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const visibility = searchParams.get('visibility') as 'company' | 'private' | undefined;

    // Fetch templates
    const templates = await getTemplates({
      companyId,
      userId,
      category,
      visibility,
    });

    // Log activity
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.TEMPLATE_LIBRARY_VIEWED,
        actorRole: ACTOR_ROLES.BUYER,
        userId,
        summary: `${session.user.name || session.user.email} viewed the template library`,
        details: {
          companyId,
          templatesCount: templates.length,
          filters: { category, visibility },
        },
      });
    } catch (logError) {
      console.error('[Templates API] Activity logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('[Templates API GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/templates
 * Create a new template
 * Body:
 * - name: string (required)
 * - description: string (optional)
 * - visibility: 'company' | 'private' (optional, default: 'company')
 * - category: string (optional)
 * - defaultTimeline: any (optional)
 * - defaultSections: any (optional)
 * - initialContentJson: any (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Only buyers can create templates' }, { status: 403 });
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      visibility = 'company',
      category,
      defaultTimeline,
      defaultSections,
      initialContentJson,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    if (!initialContentJson) {
      return NextResponse.json({ error: 'Initial content JSON is required' }, { status: 400 });
    }

    // Create template
    const template = await createTemplate({
      name: name.trim(),
      description: description?.trim(),
      companyId,
      visibility,
      category: category?.trim(),
      defaultTimeline,
      defaultSections,
      createdByUserId: userId,
      initialContentJson,
    });

    // Log activity
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.TEMPLATE_CREATED,
        actorRole: ACTOR_ROLES.BUYER,
        userId,
        summary: `${session.user.name || session.user.email} created template "${name}"`,
        details: {
          templateId: template.id,
          templateName: name,
          visibility,
          category,
          companyId,
        },
      });
    } catch (logError) {
      console.error('[Templates API] Activity logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Template created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Templates API POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
