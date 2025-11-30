/**
 * Evaluation Matrix CRUD endpoints
 * 
 * GET    /api/dashboard/rfps/[id]/matrix - Get current matrix
 * POST   /api/dashboard/rfps/[id]/matrix - Create/update matrix
 * DELETE /api/dashboard/rfps/[id]/matrix - Delete matrix
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET - Fetch current evaluation matrix for RFP
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify role is buyer
    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyer access only' }, { status: 403 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { id: true, userId: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your RFP' }, { status: 403 });
    }

    // Load matrix
    const matrix = await prisma.evaluationMatrix.findUnique({
      where: { rfpId },
    });

    if (!matrix) {
      return NextResponse.json({ matrix: null });
    }

    return NextResponse.json({
      matrix: {
        id: matrix.id,
        name: matrix.name,
        criteria: matrix.criteria,
        createdAt: matrix.createdAt,
        updatedAt: matrix.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Matrix GET Error]', error);
    return NextResponse.json(
      { error: 'Internal server error fetching matrix' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update evaluation matrix
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify role is buyer
    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyer access only' }, { status: 403 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { id: true, userId: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your RFP' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, criteria } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Matrix name is required' }, { status: 400 });
    }

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ error: 'Criteria array is required' }, { status: 400 });
    }

    // Validate criteria structure
    const validCriteria = criteria.every(
      (c) =>
        typeof c === 'object' &&
        typeof c.id === 'string' &&
        typeof c.label === 'string' &&
        typeof c.weight === 'number' &&
        c.weight >= 0 &&
        c.weight <= 100
    );

    if (!validCriteria) {
      return NextResponse.json(
        { error: 'Invalid criteria format. Each criterion must have id, label, and weight (0-100)' },
        { status: 400 }
      );
    }

    // Validate total weight = 100
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json(
        { error: `Total weight must equal 100. Current total: ${totalWeight}` },
        { status: 400 }
      );
    }

    // Upsert matrix
    const matrix = await prisma.evaluationMatrix.upsert({
      where: { rfpId },
      create: {
        rfpId,
        name: name.trim(),
        criteria,
      },
      update: {
        name: name.trim(),
        criteria,
      },
    });

    return NextResponse.json({
      success: true,
      matrix: {
        id: matrix.id,
        name: matrix.name,
        criteria: matrix.criteria,
        createdAt: matrix.createdAt,
        updatedAt: matrix.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Matrix POST Error]', error);
    return NextResponse.json(
      { error: 'Internal server error saving matrix' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete evaluation matrix
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify role is buyer
    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyer access only' }, { status: 403 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { id: true, userId: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your RFP' }, { status: 403 });
    }

    // Delete matrix if exists
    try {
      await prisma.evaluationMatrix.delete({
        where: { rfpId },
      });
    } catch (deleteError: any) {
      // If matrix doesn't exist, that's fine
      if (deleteError.code === 'P2025') {
        return NextResponse.json({ success: true, message: 'No matrix to delete' });
      }
      throw deleteError;
    }

    return NextResponse.json({ success: true, message: 'Matrix deleted successfully' });
  } catch (error) {
    console.error('[Matrix DELETE Error]', error);
    return NextResponse.json(
      { error: 'Internal server error deleting matrix' },
      { status: 500 }
    );
  }
}
