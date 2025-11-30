/**
 * API Route: Generate Risk Flags (STEP 20)
 * POST /api/supplier/responses/[responseId]/extract/risk-flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

interface RiskFlag {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  source: string;
  impact?: string;
  mitigation?: string;
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

    // Fetch supplier response with all risk-related data
    const supplierResponse = await prisma.supplierResponse.findUnique({
      where: { id: responseId },
      include: {
        rfp: {
          select: {
            id: true,
            userId: true,
            title: true,
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

    const contextData = {
      supplierName: supplierResponse.supplierContact.name,
      extractedRisks: supplierResponse.extractedRisks as any,
      extractedAssumptions: supplierResponse.extractedAssumptions as any,
      extractedPricing: supplierResponse.extractedPricing as any,
      extractedDemoSummary: supplierResponse.extractedDemoSummary as any,
      extractedRequirementsCoverage: supplierResponse.extractedRequirementsCoverage as any,
      mandatoryRequirementsStatus: supplierResponse.mandatoryRequirementsStatus as any,
      complianceFindings: supplierResponse.complianceFindings as any,
    };

    let riskFlags: RiskFlag[];

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a risk analyst evaluating a supplier's RFP response.

RFP: ${supplierResponse.rfp.title}
Supplier: ${contextData.supplierName}

Available Risk Data:
- Extracted Risks: ${JSON.stringify(contextData.extractedRisks || {})}
- Extracted Assumptions: ${JSON.stringify(contextData.extractedAssumptions || {})}
- Demo Summary: ${JSON.stringify(contextData.extractedDemoSummary || {})}
- Pricing (hidden fees): ${JSON.stringify(contextData.extractedPricing?.hiddenFeeAlerts || [])}
- Requirements Coverage: ${JSON.stringify(contextData.extractedRequirementsCoverage?.requirements || [])}
- Mandatory Requirements Status: ${JSON.stringify(contextData.mandatoryRequirementsStatus || {})}
- Compliance Findings: ${JSON.stringify(contextData.complianceFindings || {})}

Analyze all risk sources and generate a comprehensive list of risk flags.

Return a JSON array of risk flags:
[
  {
    "severity": "HIGH|MEDIUM|LOW",
    "category": "Technical|Financial|Compliance|Operational|Legal|Schedule|Resource",
    "description": "Clear description of the risk",
    "source": "where this risk was identified (e.g., extractedRisks, pricing, compliance)",
    "impact": "What could go wrong",
    "mitigation": "Suggested mitigation strategy"
  }
]

Guidelines:
- HIGH severity: Could cause project failure, significant cost overrun, legal issues
- MEDIUM severity: Could cause delays, moderate cost increases, require workarounds
- LOW severity: Minor concerns, easily manageable

Focus on actionable risks. Consolidate related risks. Be concise.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert risk analyst. Return only valid JSON array of risk flags matching the specified structure.',
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
        
        // Handle if OpenAI returns object with "riskFlags" key or direct array
        riskFlags = Array.isArray(aiResult) ? aiResult : (aiResult.riskFlags || aiResult.risks || []);
      } catch (error) {
        console.error('OpenAI risk flags error:', error);
        // Fallback to rule-based analysis
        riskFlags = buildFallbackRiskFlags(contextData);
      }
    } else {
      // No OpenAI key - use rule-based analysis
      riskFlags = buildFallbackRiskFlags(contextData);
    }

    // Save risk flags to database
    await prisma.supplierResponse.update({
      where: { id: responseId },
      data: {
        riskFlags: riskFlags as any,
      },
    });

    return NextResponse.json({
      success: true,
      riskFlags,
      count: riskFlags.length,
    });
  } catch (error) {
    console.error('Risk flags extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate risk flags', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Fallback risk flags generation using rule-based approach
 */
function buildFallbackRiskFlags(contextData: any): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Check extracted risks
  if (contextData.extractedRisks?.risks) {
    const risks = Array.isArray(contextData.extractedRisks.risks)
      ? contextData.extractedRisks.risks
      : [];

    risks.forEach((risk: any, index: number) => {
      if (index < 5) {
        // Limit to top 5
        flags.push({
          severity: risk.severity || 'MEDIUM',
          category: risk.category || 'Technical',
          description: risk.description || risk.risk || 'Risk identified',
          source: 'extractedRisks',
          impact: risk.impact || 'Potential negative impact',
          mitigation: risk.mitigation || 'Requires mitigation planning',
        });
      }
    });
  }

  // Check unmet mandatory requirements
  if (contextData.mandatoryRequirementsStatus?.unmetMandatoryCount > 0) {
    const unmet = contextData.mandatoryRequirementsStatus.unmetMandatoryList || [];
    unmet.slice(0, 3).forEach((req: any) => {
      flags.push({
        severity: req.impact === 'HIGH' ? 'HIGH' : 'MEDIUM',
        category: 'Requirements',
        description: `Mandatory requirement not met: ${req.requirement}`,
        source: 'mandatoryRequirementsStatus',
        impact: 'Cannot proceed without this capability',
        mitigation: 'Negotiate alternative solution or select different vendor',
      });
    });
  }

  // Check hidden pricing fees
  if (contextData.extractedPricing?.hiddenFeeAlerts) {
    const alerts = contextData.extractedPricing.hiddenFeeAlerts;
    alerts.slice(0, 3).forEach((alert: any) => {
      flags.push({
        severity: alert.severity || 'MEDIUM',
        category: 'Financial',
        description: alert.description || 'Hidden fee identified',
        source: 'extractedPricing',
        impact: `Budget overrun: ${alert.estimatedImpact || 'Unknown amount'}`,
        mitigation: 'Negotiate all-inclusive pricing',
      });
    });
  }

  // Check compliance issues
  if (
    contextData.complianceFindings?.overallComplianceScore &&
    contextData.complianceFindings.overallComplianceScore < 60
  ) {
    flags.push({
      severity: 'HIGH',
      category: 'Compliance',
      description: `Low compliance score (${contextData.complianceFindings.overallComplianceScore}/100)`,
      source: 'complianceFindings',
      impact: 'Regulatory or security risks',
      mitigation: 'Require compliance remediation plan',
    });
  }

  return flags;
}
