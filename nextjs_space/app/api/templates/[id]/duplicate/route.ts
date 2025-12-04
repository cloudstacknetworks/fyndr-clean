// STEP 56: Company-Level RFP Master Template Library - Duplicate Template
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { duplicateTemplate } from '@/lib/templates/template-library-service';

/**
 * POST /api/templates/[id]/duplicate
 * Duplicate a template
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

    const body = await request.json().catch(() => ({}));
    const { companyId, newName } = body;

    // If companyId is not provided, the duplicateTemplate function will use the original template's companyId
    const template = await duplicateTemplate(
      params.id,
      session.user.id,
      companyId || null, // Allow null, the service will handle it
      newName
    );

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Error duplicating template:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to duplicate template' },
      { status: 500 }
    );
  }
}
