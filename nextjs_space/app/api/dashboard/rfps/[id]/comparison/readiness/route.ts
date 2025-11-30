/**
 * API Route: Calculate Supplier Readiness (STEP 20)
 * POST /api/dashboard/rfps/[id]/comparison/readiness
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { classifySupplierReadiness, type ReadinessIndicator } from '@/lib/readiness-engine';
import { notifyUserForEvent } from '@/lib/notifications';
import { READINESS_INDICATOR_UPDATED } from '@/lib/notification-types';

const prisma = new PrismaClient();

interface SupplierReadinessResult {
  id: string;
  name: string;
  readinessIndicator: ReadinessIndicator;
  readinessRationale: string;
  readinessScore: number;
  criticalIssues: string[];
  conditionalFactors: string[];
  strengths: string[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only buyers can calculate readiness
    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyer access only' }, { status: 403 });
    }

    const { id: rfpId } = params;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your RFP' }, { status: 403 });
    }

    // Fetch all SUBMITTED supplier responses for this RFP
    const supplierResponses = await prisma.supplierResponse.findMany({
      where: {
        rfpId: rfpId,
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
        { error: 'No submitted responses found for this RFP' },
        { status: 400 }
      );
    }

    // Process each supplier and calculate readiness
    const results: SupplierReadinessResult[] = [];

    for (const response of supplierResponses) {
      const readinessAnalysis = classifySupplierReadiness({
        mandatoryStatus: response.mandatoryRequirementsStatus as any,
        complianceFindings: response.complianceFindings as any,
        riskFlags: response.riskFlags as any,
        extractedPricing: response.extractedPricing as any,
        extractedRequirementsCoverage: response.extractedRequirementsCoverage as any,
        extractedDemoSummary: response.extractedDemoSummary as any,
      });

      // Update the response with readiness data
      await prisma.supplierResponse.update({
        where: { id: response.id },
        data: {
          readinessIndicator: readinessAnalysis.indicator,
          readinessRationale: readinessAnalysis.rationale,
        },
      });

      results.push({
        id: response.id,
        name: response.supplierContact.name,
        readinessIndicator: readinessAnalysis.indicator,
        readinessRationale: readinessAnalysis.rationale,
        readinessScore: readinessAnalysis.score,
        criticalIssues: readinessAnalysis.criticalIssues,
        conditionalFactors: readinessAnalysis.conditionalFactors,
        strengths: readinessAnalysis.strengths,
      });
    }

    // Sort by readiness score (highest first)
    results.sort((a, b) => b.readinessScore - a.readinessScore);

    // STEP 22: Send notification to buyer about readiness update
    try {
      const buyer = await prisma.user.findUnique({
        where: { id: rfp.userId },
      });

      if (buyer) {
        await notifyUserForEvent(READINESS_INDICATOR_UPDATED, buyer, {
          rfpId: rfp.id,
          rfpTitle: rfp.title,
        });
      }
    } catch (notifError) {
      console.error('Error sending readiness update notification:', notifError);
      // Don't fail the readiness calculation if notification fails
    }

    return NextResponse.json({
      success: true,
      rfpTitle: rfp.title,
      suppliersAnalyzed: results.length,
      suppliers: results,
      summary: {
        ready: results.filter((r) => r.readinessIndicator === 'READY').length,
        conditional: results.filter((r) => r.readinessIndicator === 'CONDITIONAL').length,
        notReady: results.filter((r) => r.readinessIndicator === 'NOT_READY').length,
      },
    });
  } catch (error) {
    console.error('Readiness calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate supplier readiness', details: (error as Error).message },
      { status: 500 }
    );
  }
}
