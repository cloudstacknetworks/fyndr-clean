/**
 * POST /api/dashboard/rfps/[id]/comparison/run
 * 
 * Runs supplier comparison analysis for an RFP.
 * Calculates weighted scores for all submitted supplier responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import {
  computeBaseMetricsFromExtraction,
  normalizeScoresAcrossSuppliers,
  buildComparisonBreakdown,
  loadEvaluationMatrix,
  matrixCriteriaToWeights,
  DEFAULT_WEIGHTS,
} from '@/lib/supplier-comparison';

const prisma = new PrismaClient();

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
      select: { id: true, userId: true, title: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your RFP' }, { status: 403 });
    }

    // Load all SUBMITTED supplier responses for this RFP
    const supplierResponses = await prisma.supplierResponse.findMany({
      where: {
        rfpId,
        status: 'SUBMITTED',
      },
      include: {
        supplierContact: {
          select: {
            name: true,
            email: true,
            organization: true,
          },
        },
      },
    });

    if (supplierResponses.length === 0) {
      return NextResponse.json(
        { error: 'No submitted supplier responses found for comparison' },
        { status: 400 }
      );
    }

    // Check if evaluation matrix exists
    const matrix = await loadEvaluationMatrix(rfpId);
    const weights = matrix ? matrixCriteriaToWeights(matrix.criteria) : DEFAULT_WEIGHTS;
    const matrixUsed = matrix !== null;

    // Step 1: Extract base metrics from all suppliers
    const baseMetrics = supplierResponses.map((response) =>
      computeBaseMetricsFromExtraction(response)
    );

    // Step 2: Normalize metrics across all suppliers
    const normalizedSuppliers = normalizeScoresAcrossSuppliers(baseMetrics);

    // Step 3: Calculate weighted scores and build breakdowns
    const comparisons = normalizedSuppliers.map((supplier) =>
      buildComparisonBreakdown(supplier, weights)
    );

    // Step 4: Update each SupplierResponse with comparison data
    const updatePromises = comparisons.map((comparison, idx) => {
      const supplierResponse = supplierResponses[idx];
      return prisma.supplierResponse.update({
        where: { id: supplierResponse.id },
        data: {
          comparisonScore: comparison.totalScore,
          comparisonBreakdown: comparison as any,
          comparisonMatrixUsed: matrixUsed,
        },
      });
    });

    await Promise.all(updatePromises);

    // Step 5: Sort by score descending and return
    const sortedComparisons = comparisons.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({
      success: true,
      matrixUsed,
      matrixName: matrix?.name || 'Default Weights',
      comparisons: sortedComparisons,
      rfpTitle: rfp.title,
    });
  } catch (error) {
    console.error('[Comparison Run Error]', error);
    return NextResponse.json(
      { error: 'Internal server error running comparison' },
      { status: 500 }
    );
  }
}
