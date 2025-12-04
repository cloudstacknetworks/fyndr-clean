/**
 * STEP 57: Company-Level Master Requirements Library
 * API Endpoint: GET /api/requirements/[id]/versions - List versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { listVersions } from '@/lib/requirements/requirements-service';

/**
 * GET /api/requirements/[id]/versions
 * List all versions for requirement
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Access denied: Buyer role required' },
        { status: 403 }
      );
    }

    const versions = await listVersions(params.id, session.user.companyId);

    return NextResponse.json({ versions });
  } catch (error: any) {
    console.error('[GET /api/requirements/[id]/versions] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list versions' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}
