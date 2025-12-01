/**
 * STEP 34: AI Narrative Enrichment Endpoint
 * 
 * POST /api/dashboard/rfps/[id]/decision-brief/ai
 * 
 * Generates AI-powered narrative content for the decision brief using OpenAI GPT-4o-mini.
 * Falls back to template-based narrative if OpenAI is not configured or fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { composeDecisionBriefForRfp, DecisionBriefSnapshot, DecisionBriefAudience } from '@/lib/decision-brief/composer';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden - Buyer access only' }, { status: 403 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { userId: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - Not RFP owner' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const requestedAudiences: DecisionBriefAudience[] = body.audiences || ["executive"];

    // Generate fresh snapshot (without caching)
    const snapshot = await composeDecisionBriefForRfp(rfpId, {
      useExistingSnapshotIfFresh: false,
    });

    // Attempt AI generation if OpenAI is configured
    let enrichedNarrative = snapshot.narrative;
    let generatedUsingAI = false;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Construct compact prompt
        const prompt = constructAINarrativePrompt(snapshot, requestedAudiences);

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert procurement analyst creating executive decision briefs. Respond ONLY with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        });

        const rawResponse = completion.choices[0]?.message?.content;
        if (rawResponse) {
          const parsed = JSON.parse(rawResponse);
          enrichedNarrative = {
            executiveSummary: parsed.executiveSummary || enrichedNarrative.executiveSummary,
            procurementNotes: parsed.procurementNotes || enrichedNarrative.procurementNotes,
            itNotes: parsed.itNotes || enrichedNarrative.itNotes,
            financeNotes: parsed.financeNotes || enrichedNarrative.financeNotes,
          };
          generatedUsingAI = true;
        }
      } catch (aiError) {
        console.error('AI generation failed, using template-based narrative:', aiError);
        enrichedNarrative = generateTemplateBased Narrative(snapshot);
      }
    } else {
      // No OpenAI key, use template-based narrative
      enrichedNarrative = generateTemplateBasedNarrative(snapshot);
    }

    // Update snapshot with enriched narrative
    const updatedSnapshot: DecisionBriefSnapshot = {
      ...snapshot,
      narrative: enrichedNarrative,
      generatedUsingAI,
      version: snapshot.version + 1,
      audiences: requestedAudiences,
    };

    // Save updated snapshot to database
    const updatedMeta = {
      lastGeneratedAt: new Date().toISOString(),
      audiences: requestedAudiences,
      version: updatedSnapshot.version,
      generatedUsingAI,
    };

    await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        decisionBriefSnapshot: updatedSnapshot as any,
        decisionBriefMeta: updatedMeta,
      },
    });

    // Log activity
    await logActivityWithRequest(req, {
      userId: session.user.id,
      rfpId,
      eventType: EVENT_TYPES.DECISION_BRIEF_AI_GENERATED,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Generated AI decision brief for RFP: ${snapshot.rfpTitle}`,
      details: {
        rfpId,
        rfpTitle: snapshot.rfpTitle,
        generatedUsingAI,
        audiences: requestedAudiences,
        version: updatedSnapshot.version,
      },
    });

    return NextResponse.json({
      success: true,
      snapshot: updatedSnapshot,
      meta: updatedMeta,
    });
  } catch (error) {
    console.error('Error generating AI narrative:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function constructAINarrativePrompt(
  snapshot: DecisionBriefSnapshot,
  audiences: DecisionBriefAudience[]
): string {
  const supplierSummary = snapshot.supplierSummaries
    .map((s, i) => `${i + 1}. ${s.supplierName}: Score ${s.finalScore}, Readiness ${s.readinessTier}, Risk ${s.headlineRiskLevel}`)
    .join('\n');

  const riskSummary = snapshot.riskSummary.keyRisks.slice(0, 3).join('; ');

  return `
Generate a decision brief narrative for RFP: "${snapshot.rfpTitle}" (${snapshot.rfpStage} stage, Budget: $${snapshot.rfpBudget || 'N/A'}).

Recommendation: ${snapshot.coreRecommendation.recommendationType} - ${snapshot.coreRecommendation.recommendedSupplierName || 'N/A'} (Confidence: ${snapshot.coreRecommendation.confidenceScore}%)

Suppliers:
${supplierSummary}

Key Risks: ${riskSummary || 'None identified'}

Timeline: ${snapshot.timelineSummary.upcomingMilestones.map(m => m.label).join(', ') || 'No upcoming milestones'}

Generate a JSON object with these fields:
{
  "executiveSummary": "2-3 sentence executive summary for C-level stakeholders",
  "procurementNotes": "2-3 sentence procurement-specific insights",
  "itNotes": "2-3 sentence technical/IT considerations",
  "financeNotes": "2-3 sentence financial/pricing observations"
}

Keep each field concise, actionable, and focused on decision-making. Use professional tone.
`.trim();
}

function generateTemplateBasedNarrative(snapshot: DecisionBriefSnapshot) {
  const topSupplier = snapshot.supplierSummaries[0];
  const supplierCount = snapshot.supplierSummaries.length;

  const executiveSummary = topSupplier
    ? `${supplierCount} supplier${supplierCount > 1 ? 's' : ''} submitted responses for ${snapshot.rfpTitle}. ` +
      `${topSupplier.supplierName} is the recommended candidate with a score of ${topSupplier.finalScore} and ${topSupplier.readinessTier} readiness. ` +
      `Overall risk level is ${snapshot.riskSummary.overallRiskLevel}. Recommended action: ${snapshot.coreRecommendation.recommendationType.replace('_', ' ')}.`
    : `No supplier responses received yet for ${snapshot.rfpTitle}. Procurement team should monitor submission progress and follow up with invited suppliers.`;

  const procurementNotes = topSupplier
    ? `Primary evaluation shows ${topSupplier.supplierName} as the leading candidate. ` +
      `Pricing position is ${topSupplier.pricingPosition || 'under review'}. ` +
      `${snapshot.riskSummary.keyRisks.length > 0 ? `Key risks identified require mitigation before award.` : `No significant procurement risks identified.`}`
    : `Procurement should focus on ensuring timely submissions and addressing any supplier questions during the Q&A window.`;

  const itNotes = topSupplier
    ? `Technical readiness tier for ${topSupplier.supplierName} is ${topSupplier.readinessTier}. ` +
      `${topSupplier.readinessScore && topSupplier.readinessScore >= 70 ? `Technical capabilities meet requirements.` : `Additional technical validation recommended before award.`} ` +
      `IT team should review integration requirements and compliance standards.`
    : `IT team should prepare technical evaluation criteria and review supplier-provided architecture diagrams once submissions are received.`;

  const financeNotes = topSupplier && topSupplier.pricingScore
    ? `Pricing analysis shows ${topSupplier.supplierName} with a pricing competitiveness score of ${topSupplier.pricingScore}. ` +
      `${snapshot.rfpBudget ? `Proposed pricing is ${topSupplier.pricingPosition || 'under review'} relative to the $${snapshot.rfpBudget} budget.` : `Budget alignment review is pending.`} ` +
      `Finance should verify total cost of ownership and payment terms.`
    : `Financial evaluation is pending until pricing data is submitted. Finance team should prepare cost comparison models and budget approval workflows.`;

  return {
    executiveSummary,
    procurementNotes,
    itNotes,
    financeNotes,
  };
}
