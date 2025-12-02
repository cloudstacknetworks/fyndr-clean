/**
 * STEP 40: Executive Summary Composer Engine
 * 
 * AI-powered summary generation with tone and audience customization
 */

import { PrismaClient, RFP, EvaluationMatrix, SupplierResponse, SupplierContact } from '@prisma/client';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ToneType = 'professional' | 'persuasive' | 'analytical';
export type AudienceType = 'executive' | 'technical' | 'procurement';

interface SummaryGenerationOptions {
  rfpId: string;
  tone?: ToneType;
  audience?: AudienceType;
  userId: string;
}

interface RFPWithRelations extends RFP {
  evaluationMatrix?: EvaluationMatrix | null;
  supplierResponses?: (SupplierResponse & {
    supplierContact?: SupplierContact | null;
  })[];
  supplierContacts?: SupplierContact[];
}

/**
 * Generate an executive summary for an RFP using OpenAI
 */
export async function generateExecutiveSummary(
  prisma: PrismaClient,
  options: SummaryGenerationOptions
): Promise<string> {
  const { rfpId, tone = 'professional', audience = 'executive', userId } = options;

  // Fetch RFP with related data
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      evaluationMatrix: true,
      supplierResponses: {
        include: {
          supplierContact: true,
        },
      },
      supplierContacts: true,
      company: true,
    },
  }) as RFPWithRelations & { company: { name: string } };

  if (!rfp) {
    throw new Error('RFP not found');
  }

  // Gather context data
  const context = await gatherRFPContext(prisma, rfp);

  // Build prompt based on tone and audience
  const prompt = buildPrompt(rfp, context, tone, audience);

  // Call OpenAI
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(tone, audience),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: getToneTemperature(tone),
      max_tokens: 2000,
    });

    const generatedContent = completion.choices[0]?.message?.content || '';

    if (!generatedContent) {
      return getFallbackSummary(rfp, context);
    }

    return generatedContent;
  } catch (error) {
    console.error('Error generating executive summary with OpenAI:', error);
    return getFallbackSummary(rfp, context);
  }
}

/**
 * Gather relevant context from the RFP and related data
 */
async function gatherRFPContext(
  prisma: PrismaClient,
  rfp: RFPWithRelations
): Promise<Record<string, any>> {
  const context: Record<string, any> = {
    title: rfp.title,
    description: rfp.description || 'No description provided',
    status: rfp.status,
    stage: rfp.stage,
    budget: rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'Not specified',
    dueDate: rfp.dueDate ? rfp.dueDate.toLocaleDateString() : 'Not set',
    priority: rfp.priority,
    supplierCount: rfp.supplierContacts?.length || 0,
    responseCount: rfp.supplierResponses?.length || 0,
  };

  // Add evaluation data if available
  if (rfp.evaluationMatrix) {
    context.evaluationCriteria = rfp.evaluationMatrix.criteria || [];
  }

  // Add opportunity score if available
  if (rfp.opportunityScore) {
    context.opportunityScore = rfp.opportunityScore;
    context.opportunityScoreBreakdown = rfp.opportunityScoreBreakdown || {};
  }

  // Add decision brief if available
  if (rfp.decisionBriefSnapshot) {
    context.decisionBrief = rfp.decisionBriefSnapshot;
  }

  // Add comparison narrative if available
  if (rfp.comparisonNarrative) {
    context.comparisonNarrative = rfp.comparisonNarrative;
  }

  // Add supplier response details
  if (rfp.supplierResponses && rfp.supplierResponses.length > 0) {
    context.topSuppliers = rfp.supplierResponses
      .filter(r => r.status === 'SUBMITTED')
      .slice(0, 5)
      .map(r => ({
        name: r.supplierContact?.name || 'Unknown',
        organization: r.supplierContact?.organization || 'Unknown',
        pricingTotal: (r.extractedPricing as any)?.totalCost || (r.extractedPricing as any)?.total || null,
        score: r.supplierContact?.avgScore,
      }));
  }

  // Add scoring matrix if available
  if (rfp.scoringMatrixSnapshot) {
    context.scoringMatrix = rfp.scoringMatrixSnapshot;
  }

  return context;
}

/**
 * Build the prompt for OpenAI based on RFP context
 */
function buildPrompt(
  rfp: RFPWithRelations,
  context: Record<string, any>,
  tone: ToneType,
  audience: AudienceType
): string {
  const sections = [
    `# RFP Executive Summary Generation`,
    ``,
    `## RFP Details`,
    `- **Title**: ${context.title}`,
    `- **Description**: ${context.description}`,
    `- **Stage**: ${context.stage}`,
    `- **Status**: ${context.status}`,
    `- **Budget**: ${context.budget}`,
    `- **Due Date**: ${context.dueDate}`,
    `- **Priority**: ${context.priority}`,
    ``,
    `## Supplier Engagement`,
    `- **Total Suppliers**: ${context.supplierCount}`,
    `- **Responses Received**: ${context.responseCount}`,
  ];

  if (context.opportunityScore) {
    sections.push(
      ``,
      `## Opportunity Score`,
      `- **Score**: ${context.opportunityScore}/100`,
      `- **Breakdown**: ${JSON.stringify(context.opportunityScoreBreakdown, null, 2)}`
    );
  }

  if (context.topSuppliers && context.topSuppliers.length > 0) {
    sections.push(
      ``,
      `## Top Suppliers`
    );
    context.topSuppliers.forEach((supplier: any, idx: number) => {
      sections.push(
        `${idx + 1}. **${supplier.name}** (${supplier.organization})`,
        `   - Pricing: ${supplier.pricingTotal ? `$${supplier.pricingTotal.toLocaleString()}` : 'N/A'}`,
        `   - Score: ${supplier.score || 'N/A'}`
      );
    });
  }

  if (context.evaluationCriteria && context.evaluationCriteria.length > 0) {
    sections.push(
      ``,
      `## Evaluation Criteria`,
      ...context.evaluationCriteria.map((c: any) => `- ${c.name || c}`)
    );
  }

  sections.push(
    ``,
    `## Instructions`,
    `Generate a comprehensive executive summary that:`,
    `- Provides a high-level overview of the RFP`,
    `- Highlights key metrics and progress`,
    `- Identifies top suppliers and recommendations`,
    `- Addresses risks and opportunities`,
    `- Includes actionable next steps`,
    ``,
    `The tone should be **${tone}** and tailored for a **${audience}** audience.`,
    `Use clear headings and bullet points for readability.`
  );

  return sections.join('\n');
}

/**
 * Get the system prompt based on tone and audience
 */
function getSystemPrompt(tone: ToneType, audience: AudienceType): string {
  const toneDescriptions = {
    professional: 'formal, objective, and balanced',
    persuasive: 'compelling, confident, and action-oriented',
    analytical: 'data-driven, detailed, and methodical',
  };

  const audienceDescriptions = {
    executive: 'C-suite executives who need high-level strategic insights',
    technical: 'technical stakeholders who need detailed implementation considerations',
    procurement: 'procurement professionals who need cost and vendor analysis',
  };

  return `You are an expert RFP analyst generating executive summaries. 
Your writing should be ${toneDescriptions[tone]}.
Your audience is ${audienceDescriptions[audience]}.

Generate a well-structured executive summary in HTML format with:
- Clear headings (<h2>, <h3>)
- Bullet points (<ul>, <li>)
- Bold emphasis (<strong>) for key points
- Clean, professional formatting

Keep the summary concise (500-1000 words) but comprehensive.`;
}

/**
 * Get temperature setting based on tone
 */
function getToneTemperature(tone: ToneType): number {
  switch (tone) {
    case 'persuasive':
      return 0.8; // More creative
    case 'analytical':
      return 0.3; // More deterministic
    case 'professional':
    default:
      return 0.5; // Balanced
  }
}

/**
 * Fallback summary if OpenAI fails
 */
function getFallbackSummary(rfp: RFPWithRelations, context: Record<string, any>): string {
  return `
<h2>Executive Summary: ${context.title}</h2>

<h3>Overview</h3>
<p>${context.description}</p>

<h3>Key Metrics</h3>
<ul>
  <li><strong>Status</strong>: ${context.status}</li>
  <li><strong>Stage</strong>: ${context.stage}</li>
  <li><strong>Budget</strong>: ${context.budget}</li>
  <li><strong>Due Date</strong>: ${context.dueDate}</li>
  <li><strong>Priority</strong>: ${context.priority}</li>
</ul>

<h3>Supplier Engagement</h3>
<ul>
  <li><strong>Suppliers Invited</strong>: ${context.supplierCount}</li>
  <li><strong>Responses Received</strong>: ${context.responseCount}</li>
</ul>

${context.opportunityScore ? `
<h3>Opportunity Score</h3>
<p>This RFP has an opportunity score of <strong>${context.opportunityScore}/100</strong>, indicating a ${
    context.opportunityScore >= 70 ? 'strong' : context.opportunityScore >= 50 ? 'moderate' : 'lower'
  } likelihood of success.</p>
` : ''}

${context.topSuppliers && context.topSuppliers.length > 0 ? `
<h3>Top Suppliers</h3>
<ul>
${context.topSuppliers.map((s: any) => `
  <li><strong>${s.name}</strong> (${s.organization})
    <ul>
      <li>Pricing: ${s.pricingTotal ? `$${s.pricingTotal.toLocaleString()}` : 'N/A'}</li>
      <li>Score: ${s.score || 'N/A'}</li>
    </ul>
  </li>
`).join('')}
</ul>
` : ''}

<h3>Next Steps</h3>
<ul>
  <li>Review and evaluate supplier responses</li>
  <li>Conduct due diligence on top candidates</li>
  <li>Prepare for final decision and award</li>
</ul>

<p><em>This is an automatically generated summary. For detailed analysis, please review the full RFP dashboard.</em></p>
`.trim();
}

/**
 * Helper to sanitize HTML content (basic XSS prevention)
 */
export function sanitizeHTMLContent(content: string): string {
  // Basic sanitization - in production, use a library like DOMPurify
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}
