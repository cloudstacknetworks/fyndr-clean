// STEP 56: Company-Level RFP Master Template Library API - Use Template for New RFP
// POST /api/dashboard/templates/[id]/use - Create a new RFP from a template

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTemplateById } from '@/lib/templates/template-library-service';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/dashboard/templates/[id]/use
 * Apply a template to create a new RFP
 * Body:
 * - rfpTitle: string (required) - title for the new RFP
 * - rfpDescription: string (optional) - description for the new RFP
 * - supplierId: string (required) - supplier ID for the RFP
 * 
 * Returns:
 * - rfpId: string - ID of the newly created RFP
 * - prefillData: object - template content to be used for pre-filling the RFP
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication & Authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Only buyers can use templates' }, { status: 403 });
    }

    const userId = session.user.id;
    const companyId = session.user.companyId;
    const templateId = params.id;

    // Parse request body
    const body = await request.json();
    const { rfpTitle, rfpDescription, supplierId } = body;

    // Validation
    if (!rfpTitle || typeof rfpTitle !== 'string' || rfpTitle.trim().length === 0) {
      return NextResponse.json({ error: 'RFP title is required' }, { status: 400 });
    }

    if (!supplierId || typeof supplierId !== 'string' || supplierId.trim().length === 0) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    // Get template with latest version
    const template = await getTemplateById(templateId, userId);

    if (!template.versions || template.versions.length === 0) {
      return NextResponse.json({ error: 'Template has no versions' }, { status: 400 });
    }

    const latestVersion = template.versions[0];

    // Import prisma to create the RFP
    const { prisma } = await import('@/lib/prisma');

    // Create new RFP from template
    const rfp = await prisma.rFP.create({
      data: {
        title: rfpTitle.trim(),
        description: rfpDescription?.trim() || template.description || '',
        userId,
        companyId,
        supplierId: supplierId.trim(),
        stage: 'DRAFT',
        status: 'open',
        submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        expectedAwardDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
        // Apply template defaults if available
        ...(template.defaultTimeline && { timeline: template.defaultTimeline }),
        ...(template.defaultSections && { sections: template.defaultSections }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.TEMPLATE_USED_FOR_NEW_RFP,
        actorRole: ACTOR_ROLES.BUYER,
        userId,
        summary: `${session.user.name || session.user.email} used template "${template.name}" to create RFP "${rfpTitle}"`,
        details: {
          templateId: template.id,
          templateName: template.name,
          rfpId: rfp.id,
          rfpTitle,
          supplierId,
          companyId,
        },
      });
    } catch (logError) {
      console.error('[Template Use API] Activity logging failed:', logError);
    }

    return NextResponse.json({
      success: true,
      rfp,
      prefillData: latestVersion.contentJson,
      message: 'RFP created from template successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Template Use API] Error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create RFP from template' },
      { status: 500 }
    );
  }
}
