/**
 * POST /api/dashboard/rfps/[id]/comparison/ai-summary
 * 
 * Generates AI-powered decision summary for supplier comparison.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

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
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        budget: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your RFP' }, { status: 403 });
    }

    // Load all supplier responses with comparison data
    const supplierResponses = await prisma.supplierResponse.findMany({
      where: {
        rfpId,
        status: 'SUBMITTED',
        comparisonScore: { not: null },
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
      orderBy: {
        comparisonScore: 'desc',
      },
    });

    if (supplierResponses.length === 0) {
      return NextResponse.json(
        { error: 'No comparison scores found. Please run comparison first.' },
        { status: 400 }
      );
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Prepare context for OpenAI
    const suppliersContext = supplierResponses.map((response, idx) => {
      const breakdown = response.comparisonBreakdown as any;
      return {
        rank: idx + 1,
        name: response.supplierContact.name,
        organization: response.supplierContact.organization,
        score: response.comparisonScore,
        metrics: breakdown?.metrics || {},
        weightedScores: breakdown?.weightedScores || {},
        extractedPricing: response.extractedPricing,
        extractedRequirementsCoverage: response.extractedRequirementsCoverage,
        extractedRisks: response.extractedRisks,
        extractedDifferentiators: response.extractedDifferentiators,
      };
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a procurement analyst helping a buyer make an informed decision on supplier selection.

RFP Details:
- Title: ${rfp.title}
- Description: ${rfp.description || 'N/A'}
- Budget: ${rfp.budget ? `$${rfp.budget}` : 'N/A'}

Supplier Comparison Results (sorted by score):
${JSON.stringify(suppliersContext, null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "executiveSummary": "2-3 sentence overview of the comparison results",
  "recommendedSupplier": "Name of the recommended supplier",
  "reasoning": "Detailed explanation of why this supplier is recommended (2-3 paragraphs)",
  "pricingObservations": "Commentary on pricing trends and competitiveness",
  "requirementsGaps": "Summary of any significant requirements gaps across suppliers",
  "majorRisks": "Key risks to consider with the top suppliers",
  "strengthsWeaknesses": [
    {
      "supplier": "Supplier Name",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"]
    }
  ]
}

Focus on actionable insights and be objective in your analysis.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a procurement expert providing objective supplier comparison analysis. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiOutput = completion.choices[0]?.message?.content;
    if (!aiOutput) {
      throw new Error('No output from OpenAI');
    }

    // Parse JSON response
    let aiSummary: any;
    try {
      aiSummary = JSON.parse(aiOutput);
    } catch (parseError) {
      console.error('[AI Summary Parse Error]', parseError);
      throw new Error('Failed to parse AI output as JSON');
    }

    // Store AI insights in each SupplierResponse
    const updatePromises = supplierResponses.map((response) =>
      prisma.supplierResponse.update({
        where: { id: response.id },
        data: {
          comparisonAIInsights: aiSummary,
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      aiSummary,
    });
  } catch (error) {
    console.error('[AI Summary Error]', error);
    return NextResponse.json(
      { error: 'Internal server error generating AI summary' },
      { status: 500 }
    );
  }
}
