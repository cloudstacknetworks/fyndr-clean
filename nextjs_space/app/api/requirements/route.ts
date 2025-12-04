/**
 * STEP 57: Company-Level Master Requirements Library
 * API Endpoint: GET /api/requirements - List requirements
 * API Endpoint: POST /api/requirements - Create requirement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  listRequirements,
  createRequirement,
  RequirementPayload,
  RequirementFilters,
} from '@/lib/requirements/requirements-service';

/**
 * GET /api/requirements
 * List all requirements with optional filters
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const filters: RequirementFilters = {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      search: searchParams.get('search') || undefined,
      visibility: searchParams.get('visibility') as 'company' | 'private' | undefined,
    };

    const requirements = await listRequirements(
      session.user.companyId,
      session.user.id,
      filters
    );

    return NextResponse.json({ requirements });
  } catch (error: any) {
    console.error('[GET /api/requirements] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list requirements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requirements
 * Create new requirement
 */
export async function POST(req: NextRequest) {
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

    const payload: RequirementPayload = await req.json();

    // Validation
    if (!payload.title || !payload.category || !payload.contentJson) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, contentJson' },
        { status: 400 }
      );
    }

    const requirement = await createRequirement(
      payload,
      session.user.companyId,
      session.user.id
    );

    return NextResponse.json({ requirement }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/requirements] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create requirement' },
      { status: 500 }
    );
  }
}
