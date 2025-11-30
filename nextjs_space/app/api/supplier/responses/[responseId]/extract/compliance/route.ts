/**
 * API Route: Extract Compliance Findings (STEP 20)
 * POST /api/supplier/responses/[responseId]/extract/compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import {
  extractComplianceMentions,
  identifyContractualRedFlags,
  calculateComplianceScore,
  type ComplianceFindings,
} from '@/lib/compliance-utils';

const prisma = new PrismaClient();

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

    // Fetch supplier response with all necessary data
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
            email: true,
            organization: true,
          },
        },
        attachments: {
          select: {
            fileName: true,
            fileType: true,
            description: true,
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

    // Gather all available data for compliance analysis
    const contextData = {
      supplierName: supplierResponse.supplierContact.name,
      organization: supplierResponse.supplierContact.organization,
      structuredAnswers: supplierResponse.structuredAnswers as any,
      technicalClaims: supplierResponse.extractedTechnicalClaims as any,
      assumptions: supplierResponse.extractedAssumptions as any,
      risks: supplierResponse.extractedRisks as any,
      requirementsCoverage: supplierResponse.extractedRequirementsCoverage as any,
      documents: supplierResponse.extractedFilesMetadata as any,
      attachments: supplierResponse.attachments,
    };

    // Quick pre-analysis for text mentions
    const allText = JSON.stringify(contextData).toLowerCase();
    const mentions = extractComplianceMentions(allText);
    const contractFlags = identifyContractualRedFlags(allText);

    // Use OpenAI for comprehensive compliance analysis
    let complianceFindings: ComplianceFindings;

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a compliance analyst evaluating a supplier's RFP response.

RFP: ${supplierResponse.rfp.title}
Supplier: ${contextData.supplierName} (${contextData.organization || 'Organization not specified'})

Available Data:
- Structured Answers: ${JSON.stringify(contextData.structuredAnswers || {})}
- Technical Claims: ${JSON.stringify(contextData.technicalClaims || {})}
- Assumptions: ${JSON.stringify(contextData.assumptions || {})}
- Risks: ${JSON.stringify(contextData.risks || {})}
- Requirements Coverage: ${JSON.stringify(contextData.requirementsCoverage || {})}
- Document Metadata: ${JSON.stringify(contextData.documents || {})}

Pre-identified mentions:
- Security standards: ${mentions.security.join(', ') || 'None'}
- Privacy standards: ${mentions.privacy.join(', ') || 'None'}
- Accessibility standards: ${mentions.accessibility.join(', ') || 'None'}
- Regulatory standards: ${mentions.regulatory.join(', ') || 'None'}

Please analyze and return a JSON object with the following structure:
{
  "securityCompliance": {
    "certifications": ["array of security certifications claimed"],
    "claims": ["specific security claims made"],
    "verified": false,
    "gaps": ["identified security gaps or concerns"]
  },
  "dataLocality": {
    "regions": ["data center locations or regions mentioned"],
    "claims": ["data residency claims"],
    "concerns": ["any data locality concerns"]
  },
  "privacyCompliance": {
    "standards": ["privacy standards mentioned"],
    "claims": ["privacy compliance claims"],
    "gaps": ["privacy gaps identified"]
  },
  "accessibilityCompliance": {
    "standards": ["accessibility standards mentioned"],
    "claims": ["accessibility claims"],
    "gaps": ["accessibility gaps"]
  },
  "regulatoryCompliance": {
    "vertical": "healthcare|finance|education|general",
    "standards": ["regulatory standards mentioned"],
    "claims": ["regulatory compliance claims"],
    "gaps": ["regulatory gaps"]
  },
  "summary": "A 2-3 sentence summary of overall compliance posture"
}

Be thorough but concise. If information is missing, note it as a gap.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert compliance analyst. Return only valid JSON matching the specified structure.',
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

        // Calculate overall compliance score
        const score = calculateComplianceScore({
          ...aiResult,
          contractualRedFlags: contractFlags,
        });

        complianceFindings = {
          ...aiResult,
          contractualRedFlags: contractFlags,
          overallComplianceScore: score,
          summary: aiResult.summary || 'Compliance analysis completed',
        };
      } catch (error) {
        console.error('OpenAI compliance analysis error:', error);
        // Fallback to rule-based analysis
        complianceFindings = buildFallbackComplianceFindings(mentions, contractFlags);
      }
    } else {
      // No OpenAI key - use rule-based analysis
      complianceFindings = buildFallbackComplianceFindings(mentions, contractFlags);
    }

    // Save compliance findings to database
    await prisma.supplierResponse.update({
      where: { id: responseId },
      data: {
        complianceFindings: complianceFindings as any,
      },
    });

    return NextResponse.json({
      success: true,
      complianceFindings,
    });
  } catch (error) {
    console.error('Compliance extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract compliance findings', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Fallback compliance analysis using rule-based approach
 */
function buildFallbackComplianceFindings(
  mentions: ReturnType<typeof extractComplianceMentions>,
  contractFlags: ReturnType<typeof identifyContractualRedFlags>
): ComplianceFindings {
  const findings: ComplianceFindings = {
    securityCompliance: {
      certifications: mentions.security,
      claims: mentions.security.map((cert) => `Claims ${cert} certification`),
      verified: false,
      gaps: mentions.security.length === 0 ? ['No security certifications mentioned'] : [],
    },
    dataLocality: {
      regions: [],
      claims: [],
      concerns: ['Data residency not explicitly addressed'],
    },
    privacyCompliance: {
      standards: mentions.privacy,
      claims: mentions.privacy.map((std) => `Mentions ${std} compliance`),
      gaps: mentions.privacy.length === 0 ? ['No privacy standards mentioned'] : [],
    },
    accessibilityCompliance: {
      standards: mentions.accessibility,
      claims: mentions.accessibility.map((std) => `Mentions ${std} compliance`),
      gaps: mentions.accessibility.length === 0 ? ['No accessibility standards mentioned'] : [],
    },
    regulatoryCompliance: {
      vertical: mentions.regulatory.length > 0 ? 'general' : undefined,
      standards: mentions.regulatory,
      claims: mentions.regulatory.map((std) => `Mentions ${std} compliance`),
      gaps: mentions.regulatory.length === 0 ? ['No regulatory standards mentioned'] : [],
    },
    contractualRedFlags: contractFlags,
    overallComplianceScore: 0,
    summary: 'Rule-based compliance analysis completed',
  };

  findings.overallComplianceScore = calculateComplianceScore(findings);

  return findings;
}
