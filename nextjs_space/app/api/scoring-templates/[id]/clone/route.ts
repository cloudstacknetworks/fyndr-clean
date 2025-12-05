import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { cloneTemplate } from '@/lib/scoring/scoring-template-service';

/**
 * POST /api/scoring-templates/[id]/clone - Clone a template
 */
export async function POST(
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

    const cloned = await cloneTemplate(params.id, companyId, userId);

    return NextResponse.json({ template: cloned }, { status: 201 });
  } catch (error: any) {
    console.error('Error cloning template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clone template' },
      { status: 500 }
    );
  }
}
