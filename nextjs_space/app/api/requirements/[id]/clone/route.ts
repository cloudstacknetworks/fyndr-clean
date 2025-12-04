/**
 * STEP 57: Company-Level Master Requirements Library
 * API Endpoint: POST /api/requirements/[id]/clone - Clone requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { cloneRequirement } from '@/lib/requirements/requirements-service';

/**
 * POST /api/requirements/[id]/clone
 * Clone requirement with "(Copy)" suffix
 */
export async function POST(
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

    const cloned = await cloneRequirement(
      params.id,
      session.user.companyId,
      session.user.id
    );

    return NextResponse.json({ requirement: cloned }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/requirements/[id]/clone] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clone requirement' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}
