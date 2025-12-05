import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { insertTemplateIntoRfp } from '@/lib/scoring/scoring-template-service';

/**
 * POST /api/scoring-templates/[id]/insert-rfp - Insert template into RFP (frozen copy)
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

    const body = await request.json();
    const { rfpId } = body;

    if (!rfpId) {
      return NextResponse.json({ error: 'RFP ID is required' }, { status: 400 });
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;

    const result = await insertTemplateIntoRfp(rfpId, params.id, companyId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error inserting template into RFP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to insert template into RFP' },
      { status: 500 }
    );
  }
}
