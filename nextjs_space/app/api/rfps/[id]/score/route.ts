/**
 * RFP Opportunity Scoring API
 * STEP 13: POST /api/rfps/[id]/score
 * 
 * Calculates or overrides the opportunity score for an RFP
 * Supports both AI-driven auto scoring and manual overrides
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import {
  OpportunityScoreBreakdown,
  calculateWeightedOpportunityScore,
  validateBreakdown,
} from '@/lib/opportunity-scoring';
import { STAGE_LABELS } from '@/lib/stages';

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ================================
// Helper: Heuristic Scoring Fallback
// ================================

/**
 * Generates a basic heuristic score when AI is unavailable
 */
function generateHeuristicScore(rfp: any): OpportunityScoreBreakdown {
  // Simple heuristic based on available data
  const priorityScore = rfp.priority === 'HIGH' ? 80 : rfp.priority === 'MEDIUM' ? 60 : 40;
  const budgetScore = rfp.budget && rfp.budget > 10000 ? 75 : 50;
  const stageScore = ['QUALIFICATION', 'DISCOVERY', 'DRAFTING'].includes(rfp.stage) ? 70 : 50;
  
  return {
    strategicFit: {
      score: priorityScore,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    solutionFit: {
      score: stageScore,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    competitiveAdvantage: {
      score: 60,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    budgetAlignment: {
      score: budgetScore,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    timelineFeasibility: {
      score: 65,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    winProbability: {
      score: priorityScore,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    internalReadiness: {
      score: 70,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    riskScore: {
      score: 30,
      rationale: 'Heuristic-based score due to AI unavailability',
    },
    overallComment: 'Score generated using heuristic rules. Enable OpenAI for more accurate assessment.',
  };
}

// ================================
// Helper: AI Scoring
// ================================

/**
 * Uses OpenAI to generate intelligent opportunity scores
 */
async function generateAIScore(
  rfp: any,
  tasks: any[]
): Promise<OpportunityScoreBreakdown> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  // Build context for AI
  const completedTasks = tasks.filter(t => t.completed).map(t => t.title);
  const incompleteTasks = tasks.filter(t => !t.completed).map(t => t.title);

  const systemPrompt = `You are an enterprise RFP opportunity evaluator. Given the RFP context, assign a 0–100 score for each dimension:
- strategicFit: How well this opportunity aligns with our overall strategy
- solutionFit: How well the solution fits the requirements
- competitiveAdvantage: How strong our differentiation is
- budgetAlignment: Budget fit vs. our expectations
- timelineFeasibility: Can we realistically meet the timeline?
- winProbability: Estimated likelihood of winning
- internalReadiness: Do we have resources/bandwidth to execute?
- riskScore: Overall risk (higher = more risk)

Return ONLY a JSON object with numeric 'score' and short 'rationale' for each dimension, plus an 'overallComment' field.
Do not include any explanation outside the JSON.`;

  const userPrompt = `Evaluate this RFP opportunity:

Title: ${rfp.title}
Description: ${rfp.description || 'N/A'}
Stage: ${STAGE_LABELS[rfp.stage] || rfp.stage}
Company: ${rfp.company?.name || 'Unknown'}
Supplier: ${rfp.supplier?.name || 'Unknown'}
Budget: ${rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'Not specified'}
Priority: ${rfp.priority || 'Not set'}
Due Date: ${rfp.dueDate ? new Date(rfp.dueDate).toLocaleDateString() : 'Not set'}
Internal Notes: ${rfp.internalNotes || 'None'}

Completed Tasks (${completedTasks.length}):
${completedTasks.length > 0 ? completedTasks.map(t => `- ${t}`).join('\n') : '- None'}

Incomplete Tasks (${incompleteTasks.length}):
${incompleteTasks.length > 0 ? incompleteTasks.map(t => `- ${t}`).join('\n') : '- None'}

Provide scores and rationales for all 8 dimensions.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    const breakdown = JSON.parse(content);

    // Validate structure
    if (!validateBreakdown(breakdown)) {
      throw new Error('Invalid breakdown structure from OpenAI');
    }

    return breakdown as OpportunityScoreBreakdown;
  } catch (error) {
    console.error('OpenAI scoring failed:', error);
    throw error;
  }
}

// ================================
// POST Handler
// ================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const rfpId = params.id;

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { mode, breakdown, overrideReason } = body;

    // 3. Validate mode
    if (!mode || !['auto', 'manual'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "auto" or "manual".' },
        { status: 400 }
      );
    }

    // 4. Fetch RFP with related data
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        company: { select: { name: true } },
        supplier: { select: { name: true } },
        stageTasks: { select: { title: true, completed: true, stage: true } },
      },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }

    // 5. Check ownership
    if (rfp.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden. You do not own this RFP.' },
        { status: 403 }
      );
    }

    let scoreBreakdown: OpportunityScoreBreakdown;
    let totalScore: number;

    // 6. Handle manual mode
    if (mode === 'manual') {
      if (!breakdown) {
        return NextResponse.json(
          { error: 'Breakdown is required for manual mode' },
          { status: 400 }
        );
      }

      // Validate breakdown structure
      if (!validateBreakdown(breakdown)) {
        return NextResponse.json(
          { error: 'Invalid breakdown structure. All dimensions with score and rationale required.' },
          { status: 400 }
        );
      }

      scoreBreakdown = breakdown;
      totalScore = calculateWeightedOpportunityScore(scoreBreakdown);
    }
    // 7. Handle auto mode
    else {
      try {
        // Try AI scoring first
        scoreBreakdown = await generateAIScore(rfp, rfp.stageTasks);
        totalScore = calculateWeightedOpportunityScore(scoreBreakdown);
      } catch (error) {
        console.error('AI scoring failed, falling back to heuristic:', error);
        
        // Fallback to heuristic scoring
        scoreBreakdown = generateHeuristicScore(rfp);
        totalScore = calculateWeightedOpportunityScore(scoreBreakdown);
      }
    }

    // 8. Update RFP with scores
    const updatedRfp = await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        opportunityScore: totalScore,
        opportunityScoreBreakdown: scoreBreakdown as any,
        opportunityScoreUpdatedAt: new Date(),
        opportunityScoreSource: mode === 'auto' ? 'AUTO' : 'MANUAL',
        opportunityScoreOverrideReason: mode === 'manual' ? (overrideReason || null) : null,
      },
      include: {
        company: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });

    // 9. Return success response
    return NextResponse.json({
      success: true,
      rfp: updatedRfp,
      score: totalScore,
      breakdown: scoreBreakdown,
      source: mode === 'auto' ? 'AUTO' : 'MANUAL',
    });

  } catch (error) {
    console.error('Error in opportunity scoring:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during scoring',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
