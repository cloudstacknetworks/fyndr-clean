// STEP 56: Company-Level RFP Master Template Library - Single Template Operations
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  type UpdateTemplateInput,
} from '@/lib/templates/template-library-service';

/**
 * GET /api/templates/[id]
 * Get a single template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await getTemplateById(params.id, session.user.id);

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/templates/[id]
 * Update a template (metadata and/or create new version)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const input: UpdateTemplateInput = {
      ...body,
      updatedByUserId: session.user.id,
    };

    const template = await updateTemplate(params.id, input);

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error updating template:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * Soft delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await deleteTemplate(params.id, session.user.id);

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
