import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTemplate, updateTemplate, archiveTemplate } from '@/lib/scoring/scoring-template-service';

/**
 * GET /api/scoring-templates/[id] - Get a single template
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

    const companyId = session.user.companyId;
    const userId = session.user.id;

    const template = await getTemplate(params.id, companyId, userId);

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error getting template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scoring-templates/[id] - Update a template
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
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const template = await updateTemplate(params.id, body, companyId, userId);

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scoring-templates/[id] - Archive a template
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

    const companyId = session.user.companyId;
    const userId = session.user.id;

    const result = await archiveTemplate(params.id, companyId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error archiving template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive template' },
      { status: 500 }
    );
  }
}
