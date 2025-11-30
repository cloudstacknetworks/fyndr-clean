import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

/**
 * POST /api/rfps/[id]/compare/narrative
 * 
 * Generates AI narrative comparison report with 10 structured sections
 * Requires buyer role and RFP ownership
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify buyer role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: Buyer access only' }, { status: 403 });
    }

    const rfpId = params.id;

    // Load RFP with opportunity score
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        company: { select: { name: true } },
        supplier: { select: { name: true } },
        evaluationMatrix: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Verify ownership
    if (rfp.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Not RFP owner' }, { status: 403 });
    }

    // Load all submitted supplier responses with comparison data
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
        attachments: {
          select: { fileName: true, attachmentType: true },
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

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build comprehensive context for AI
    const supplierSummaries = supplierResponses.map((sr, index) => ({
      rank: index + 1,
      name: sr.supplierContact.name || sr.supplierContact.organization || 'Unnamed Supplier',
      organization: sr.supplierContact.organization,
      score: sr.comparisonScore,
      breakdown: sr.comparisonBreakdown,
      extracted: {
        requirements: sr.extractedRequirementsCoverage,
        pricing: sr.extractedPricing,
        claims: sr.extractedTechnicalClaims,
        risks: sr.extractedRisks,
        differentiators: sr.extractedDifferentiators,
        demo: sr.extractedDemoSummary,
      },
      attachmentsCount: sr.attachments.length,
    }));

    const matrixInfo = rfp.evaluationMatrix
      ? {
          name: rfp.evaluationMatrix.name,
          criteria: rfp.evaluationMatrix.criteria,
        }
      : null;

    // Construct AI prompt
    const systemPrompt = `You are an expert procurement analyst generating an executive decision report for an RFP evaluation. Your analysis must be enterprise-grade, concise, analytical, and actionable.`;

    const userPrompt = `Generate a comprehensive narrative comparison report for the following RFP evaluation:

**RFP Context:**
- Title: ${rfp.title}
- Description: ${rfp.description || 'N/A'}
- Company: ${rfp.company.name}
- Opportunity Score: ${rfp.opportunityScore || 'Not calculated'}/100
- Budget: ${rfp.budget ? `$${rfp.budget}` : 'N/A'}
- Number of Suppliers: ${supplierResponses.length}
- Evaluation Matrix: ${matrixInfo ? matrixInfo.name : 'Default Weights'}

**Supplier Comparison Data:**
${JSON.stringify(supplierSummaries, null, 2)}

Generate a structured narrative with the following 10 sections. Return ONLY valid JSON in this exact format:

{
  "overview": "Brief RFP overview including title, opportunity score, timeline, and number of participating suppliers.",
  "supplierSummaries": {
    "Supplier A": "Brief 2-3 sentence overview of Supplier A",
    "Supplier B": "Brief 2-3 sentence overview of Supplier B"
  },
  "strengths": {
    "Supplier A": ["Strength 1", "Strength 2", "Strength 3"],
    "Supplier B": ["Strength 1", "Strength 2", "Strength 3"]
  },
  "requirementsComparison": "Detailed comparison of requirements coverage across suppliers with percentages and gaps.",
  "pricingComparison": "Normalized pricing analysis comparing total costs, competitiveness scores, and hidden fees.",
  "risksComparison": "Risk profiles comparison including severity levels and mitigation recommendations.",
  "differentiatorsComparison": "Unique value propositions and competitive advantages per supplier.",
  "demoComparison": "Demo quality assessment including capabilities demonstrated and gaps observed.",
  "recommendation": "EXPLICIT recommendation: 'Recommend Supplier X because...' with detailed rationale covering all dimensions.",
  "tieBreaker": ${supplierResponses.length > 1 && Math.abs(supplierResponses[0].comparisonScore! - supplierResponses[1].comparisonScore!) < 5 ? '"Detailed tie-break analysis since scores are within 5 points of each other."' : 'null'}
}

IMPORTANT:
- Use supplier names from supplierContact.name or organization
- Base analysis on actual comparison scores and extracted data
- Be specific with numbers and percentages
- Recommendation MUST explicitly state "Recommend [Supplier Name] because..."
- If only one supplier, adjust language to evaluation rather than comparison
- Tie-breaker section ONLY if scores differ by less than 5 points`;

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const narrativeText = completion.choices[0].message.content;
    if (!narrativeText) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate narrative structure
    const narrative = JSON.parse(narrativeText);

    // Validate required fields
    const requiredFields = [
      'overview',
      'supplierSummaries',
      'strengths',
      'requirementsComparison',
      'pricingComparison',
      'risksComparison',
      'differentiatorsComparison',
      'demoComparison',
      'recommendation',
    ];

    for (const field of requiredFields) {
      if (!narrative[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Save narrative to RFP
    await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        comparisonNarrative: narrative,
      },
    });

    return NextResponse.json({
      success: true,
      narrative,
      suppliersAnalyzed: supplierResponses.length,
      matrixUsed: matrixInfo?.name || 'Default Weights',
    });
  } catch (error) {
    console.error('Error generating narrative:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
