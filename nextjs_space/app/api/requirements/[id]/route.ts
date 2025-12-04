/**
 * STEP 57: Company-Level Master Requirements Library
 * API Endpoint: GET /api/requirements/[id] - Get requirement
 * API Endpoint: PUT /api/requirements/[id] - Update requirement
 * API Endpoint: DELETE /api/requirements/[id] - Archive requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getRequirement,
  updateRequirement,
  archiveRequirement,
  RequirementPayload,
} from '@/lib/requirements/requirements-service';

/**
 * GET /api/requirements/[id]
 * Get single requirement with all versions
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

    const requirement = await getRequirement(
      params.id,
      session.user.companyId,
      session.user.id
    );

    return NextResponse.json({ requirement });
  } catch (error: any) {
    console.error('[GET /api/requirements/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get requirement' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}

/**
 * PUT /api/requirements/[id]
 * Update requirement and create new version
 */
export async function PUT(
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

    const payload: Partial<RequirementPayload> = await req.json();

    const requirement = await updateRequirement(
      params.id,
      payload,
      session.user.companyId,
      session.user.id
    );

    return NextResponse.json({ requirement });
  } catch (error: any) {
    console.error('[PUT /api/requirements/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update requirement' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}

/**
 * DELETE /api/requirements/[id]
 * Archive requirement (soft delete)
 */
export async function DELETE(
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

    const result = await archiveRequirement(
      params.id,
      session.user.companyId,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[DELETE /api/requirements/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive requirement' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}
