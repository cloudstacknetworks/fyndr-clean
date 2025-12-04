/**
 * STEP 57: Company-Level Master Requirements Library
 * API Endpoint: POST /api/requirements/insert - Insert requirement(s) into RFP/Template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  insertRequirementIntoRfp,
  insertRequirementIntoTemplate,
  bulkInsertRequirements,
} from '@/lib/requirements/requirements-service';

/**
 * POST /api/requirements/insert
 * Insert single or multiple requirements into RFP or Template
 * 
 * Body:
 * {
 *   targetId: string (RFP ID or Template ID)
 *   targetType: 'rfp' | 'template'
 *   requirementIds: string[] (single or multiple)
 * }
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

    const body = await req.json();
    const { targetId, targetType, requirementIds } = body;

    // Validation
    if (!targetId || !targetType || !requirementIds) {
      return NextResponse.json(
        { error: 'Missing required fields: targetId, targetType, requirementIds' },
        { status: 400 }
      );
    }

    if (!['rfp', 'template'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid targetType. Must be "rfp" or "template"' },
        { status: 400 }
      );
    }

    if (!Array.isArray(requirementIds) || requirementIds.length === 0) {
      return NextResponse.json(
        { error: 'requirementIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Use appropriate insertion method
    if (requirementIds.length === 1) {
      // Single insertion
      const requirementId = requirementIds[0];
      
      if (targetType === 'rfp') {
        const result = await insertRequirementIntoRfp(
          targetId,
          requirementId,
          session.user.companyId,
          session.user.id
        );
        return NextResponse.json(result, { status: 201 });
      } else {
        const result = await insertRequirementIntoTemplate(
          targetId,
          requirementId,
          session.user.companyId,
          session.user.id
        );
        return NextResponse.json(result, { status: 201 });
      }
    } else {
      // Bulk insertion
      const result = await bulkInsertRequirements(
        targetId,
        requirementIds,
        targetType,
        session.user.companyId,
        session.user.id
      );
      return NextResponse.json(result, { status: 201 });
    }
  } catch (error: any) {
    console.error('[POST /api/requirements/insert] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to insert requirements' },
      { status: 500 }
    );
  }
}
