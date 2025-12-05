import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { listVersions } from '@/lib/scoring/scoring-template-service';

/**
 * GET /api/scoring-templates/[id]/versions - List all versions of a template
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

    const versions = await listVersions(params.id, companyId, userId);

    return NextResponse.json({ versions });
  } catch (error: any) {
    console.error('Error listing versions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list versions' },
      { status: 500 }
    );
  }
}
