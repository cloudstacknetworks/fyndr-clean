import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { listTemplates, createTemplate } from '@/lib/scoring/scoring-template-service';

/**
 * GET /api/scoring-templates - List all scoring templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      visibility: (searchParams.get('visibility') as 'company' | 'private') || undefined
    };

    const companyId = session.user.companyId;
    const userId = session.user.id;

    const templates = await listTemplates(companyId, userId, filters);

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scoring-templates - Create a new scoring template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const template = await createTemplate(body, companyId, userId);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
