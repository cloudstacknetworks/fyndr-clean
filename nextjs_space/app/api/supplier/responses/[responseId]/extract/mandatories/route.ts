/**
 * API Route: Extract Mandatory Requirements Status (STEP 20)
 * POST /api/supplier/responses/[responseId]/extract/mandatories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

interface MandatoryRequirement {
  requirement: string;
  status: string;
  impact: string;
  notes?: string;
}

interface MandatoryRequirementsStatus {
  unmetMandatoryCount: number;
  partiallyMetMandatoryCount: number;
  unmetMandatoryList: MandatoryRequirement[];
  partiallyMetMandatoryList: MandatoryRequirement[];
  overallMandatoryPass: boolean;
  summary: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { responseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only buyers can run extractions
    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyer access only' }, { status: 403 });
    }

    const { responseId } = params;

    // Fetch supplier response with requirements coverage
    const supplierResponse = await prisma.supplierResponse.findUnique({
      where: { id: responseId },
      include: {
        rfp: {
          select: {
            id: true,
            userId: true,
            title: true,
            description: true,
          },
        },
        supplierContact: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!supplierResponse) {
      return NextResponse.json({ error: 'Supplier response not found' }, { status: 404 });
    }

    // Verify RFP ownership
    if (supplierResponse.rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your RFP' }, { status: 403 });
    }

    // Ensure response is submitted
    if (supplierResponse.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Response must be submitted before extraction' },
        { status: 400 }
      );
    }

    const requirementsCoverage = supplierResponse.extractedRequirementsCoverage as any;

    let mandatoryStatus: MandatoryRequirementsStatus;

    if (process.env.OPENAI_API_KEY && requirementsCoverage) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a procurement analyst evaluating supplier requirement coverage.

RFP: ${supplierResponse.rfp.title}
RFP Description: ${supplierResponse.rfp.description || 'N/A'}
Supplier: ${supplierResponse.supplierContact.name}

Requirements Coverage Data:
${JSON.stringify(requirementsCoverage, null, 2)}

Your task:
1. Identify which requirements are MANDATORY vs OPTIONAL based on:
   - Explicit keywords like "must", "required", "mandatory", "shall"
   - Critical functional needs
   - RFP description context
2. For each requirement marked as "Does Not Meet" or "Partially Meets", determine if it's mandatory
3. Assess the IMPACT level (HIGH, MEDIUM, LOW) of each unmet or partially met mandatory requirement

Return a JSON object:
{
  "unmetMandatoryList": [
    {
      "requirement": "requirement name",
      "status": "Does Not Meet",
      "impact": "HIGH|MEDIUM|LOW",
      "notes": "why this is critical"
    }
  ],
  "partiallyMetMandatoryList": [
    {
      "requirement": "requirement name",
      "status": "Partially Meets",
      "impact": "HIGH|MEDIUM|LOW",
      "notes": "what's missing"
    }
  ],
  "summary": "Brief summary of mandatory requirements status"
}

Be conservative - only flag truly mandatory items. Most items are optional.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert procurement analyst. Return only valid JSON matching the specified structure.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        });

        const aiResult = JSON.parse(completion.choices[0]?.message?.content || '{}');

        mandatoryStatus = {
          unmetMandatoryCount: aiResult.unmetMandatoryList?.length || 0,
          partiallyMetMandatoryCount: aiResult.partiallyMetMandatoryList?.length || 0,
          unmetMandatoryList: aiResult.unmetMandatoryList || [],
          partiallyMetMandatoryList: aiResult.partiallyMetMandatoryList || [],
          overallMandatoryPass:
            (aiResult.unmetMandatoryList?.length || 0) === 0 &&
            (aiResult.partiallyMetMandatoryList?.length || 0) <= 1,
          summary:
            aiResult.summary ||
            `${aiResult.unmetMandatoryList?.length || 0} mandatory requirements unmet`,
        };
      } catch (error) {
        console.error('OpenAI mandatory requirements error:', error);
        // Fallback to rule-based analysis
        mandatoryStatus = buildFallbackMandatoryStatus(requirementsCoverage);
      }
    } else {
      // No OpenAI key or no requirements data - use rule-based analysis
      mandatoryStatus = buildFallbackMandatoryStatus(requirementsCoverage);
    }

    // Save mandatory status to database
    await prisma.supplierResponse.update({
      where: { id: responseId },
      data: {
        mandatoryRequirementsStatus: mandatoryStatus as any,
      },
    });

    return NextResponse.json({
      success: true,
      mandatoryStatus,
    });
  } catch (error) {
    console.error('Mandatory requirements extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract mandatory requirements', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Fallback mandatory requirements analysis using rule-based approach
 */
function buildFallbackMandatoryStatus(requirementsCoverage: any): MandatoryRequirementsStatus {
  if (!requirementsCoverage || !requirementsCoverage.requirements) {
    return {
      unmetMandatoryCount: 0,
      partiallyMetMandatoryCount: 0,
      unmetMandatoryList: [],
      partiallyMetMandatoryList: [],
      overallMandatoryPass: true,
      summary: 'No requirements coverage data available',
    };
  }

  const requirements = requirementsCoverage.requirements || [];

  // Simple rule: requirements with "Does Not Meet" are flagged
  const unmetList = requirements
    .filter((req: any) => req.status === 'Does Not Meet')
    .map((req: any) => ({
      requirement: req.requirement,
      status: 'Does Not Meet',
      impact: 'MEDIUM',
      notes: req.notes || 'Requirement not met',
    }));

  const partialList = requirements
    .filter((req: any) => req.status === 'Partially Meets')
    .map((req: any) => ({
      requirement: req.requirement,
      status: 'Partially Meets',
      impact: 'LOW',
      notes: req.notes || 'Requirement partially addressed',
    }));

  return {
    unmetMandatoryCount: unmetList.length,
    partiallyMetMandatoryCount: partialList.length,
    unmetMandatoryList: unmetList,
    partiallyMetMandatoryList: partialList,
    overallMandatoryPass: unmetList.length === 0,
    summary: `${unmetList.length} requirements not met, ${partialList.length} partially met`,
  };
}
