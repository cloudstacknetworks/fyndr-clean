// STEP 56: Company-Level RFP Master Template Library - List & Create Templates
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getTemplates,
  createTemplate,
  type TemplateQueryFilters,
  type CreateTemplateInput,
} from '@/lib/templates/template-library-service';

/**
 * GET /api/templates
 * List all templates for a company (filtered by permissions)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const category = searchParams.get('category') || undefined;
    const visibility = searchParams.get('visibility') as 'company' | 'private' | undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const filters: TemplateQueryFilters = {
      companyId,
      userId: session.user.id,
      category,
      visibility,
      includeDeleted,
    };

    const templates = await getTemplates(filters);

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      description,
      companyId,
      visibility = 'company',
      category,
      defaultTimeline,
      defaultSections,
      initialContentJson,
    } = body;

    if (!name || !companyId || !initialContentJson) {
      return NextResponse.json(
        { error: 'name, companyId, and initialContentJson are required' },
        { status: 400 }
      );
    }

    const input: CreateTemplateInput = {
      name,
      description,
      companyId,
      visibility,
      category,
      defaultTimeline,
      defaultSections,
      createdByUserId: session.user.id,
      initialContentJson,
    };

    const template = await createTemplate(input);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
