/**
 * API Route: Extract Diversity Metadata (STEP 20)
 * POST /api/supplier/responses/[responseId]/extract/diversity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

interface DiversityCertification {
  type: string;
  verified: boolean;
  source: string;
}

interface DiversityMetadata {
  womanOwned: boolean;
  minorityOwned: boolean;
  veteranOwned: boolean;
  smallBusiness: boolean;
  localBusiness: boolean;
  certifications: DiversityCertification[];
  diversityScore: number;
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

    // Fetch supplier response with documents
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
            organization: true,
          },
        },
        attachments: {
          select: {
            fileName: true,
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

    const contextData = {
      supplierName: supplierResponse.supplierContact.name,
      organization: supplierResponse.supplierContact.organization,
      structuredAnswers: supplierResponse.structuredAnswers as any,
      attachments: supplierResponse.attachments,
      extractedDocuments: supplierResponse.extractedFilesMetadata as any,
    };

    let diversityMetadata: DiversityMetadata;

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a diversity and supplier classification analyst.

Supplier: ${contextData.supplierName}
Organization: ${contextData.organization || 'Not specified'}

Available Data:
- Structured Answers: ${JSON.stringify(contextData.structuredAnswers || {})}
- Attachments: ${JSON.stringify(contextData.attachments || [])}
- Document Metadata: ${JSON.stringify(contextData.extractedDocuments || {})}

Analyze the supplier information and return a JSON object:
{
  "womanOwned": true|false,
  "minorityOwned": true|false,
  "veteranOwned": true|false,
  "smallBusiness": true|false,
  "localBusiness": true|false,
  "certifications": [
    {
      "type": "WBENC|MBE|VBE|SBA 8(a)|etc",
      "verified": false,
      "source": "where this was mentioned"
    }
  ],
  "summary": "Brief summary of diversity attributes"
}

Common diversity certifications to look for:
- WBENC (Women's Business Enterprise National Council)
- MBE (Minority Business Enterprise)
- VBE (Veteran Business Enterprise)
- VOSB (Veteran-Owned Small Business)
- SDVOSB (Service-Disabled Veteran-Owned Small Business)
- SBA 8(a) (Small Business Administration 8(a) certification)
- HUBZone (Historically Underutilized Business Zone)

If no clear evidence exists, default to false. Only mark as true if explicitly stated.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert in supplier diversity classification. Return only valid JSON matching the specified structure.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        });

        const aiResult = JSON.parse(completion.choices[0]?.message?.content || '{}');

        // Calculate diversity score
        const diversityScore = calculateDiversityScore(aiResult);

        diversityMetadata = {
          ...aiResult,
          diversityScore,
          summary: aiResult.summary || 'Diversity analysis completed',
        };
      } catch (error) {
        console.error('OpenAI diversity analysis error:', error);
        // Fallback to rule-based analysis
        diversityMetadata = buildFallbackDiversityMetadata(contextData);
      }
    } else {
      // No OpenAI key - use rule-based analysis
      diversityMetadata = buildFallbackDiversityMetadata(contextData);
    }

    // Save diversity metadata to database
    await prisma.supplierResponse.update({
      where: { id: responseId },
      data: {
        diversityMetadata: diversityMetadata as any,
      },
    });

    return NextResponse.json({
      success: true,
      diversityMetadata,
    });
  } catch (error) {
    console.error('Diversity extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract diversity metadata', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Calculate diversity score based on attributes
 */
function calculateDiversityScore(metadata: Partial<DiversityMetadata>): number {
  let score = 0;

  if (metadata.womanOwned) score += 20;
  if (metadata.minorityOwned) score += 20;
  if (metadata.veteranOwned) score += 20;
  if (metadata.smallBusiness) score += 15;
  if (metadata.localBusiness) score += 10;

  const certCount = metadata.certifications?.length || 0;
  score += Math.min(15, certCount * 5);

  return Math.min(100, score);
}

/**
 * Fallback diversity analysis using rule-based approach
 */
function buildFallbackDiversityMetadata(contextData: any): DiversityMetadata {
  const allText = JSON.stringify(contextData).toLowerCase();

  // Simple keyword detection
  const womanOwned = /woman.owned|wbe|wbenc/i.test(allText);
  const minorityOwned = /minority.owned|mbe|mwbe/i.test(allText);
  const veteranOwned = /veteran.owned|vbe|vosb|sdvosb/i.test(allText);
  const smallBusiness = /small business|sba|8\(a\)|hubzone/i.test(allText);
  const localBusiness = /local business|locally.owned/i.test(allText);

  const certifications: DiversityCertification[] = [];

  if (allText.includes('wbenc')) {
    certifications.push({ type: 'WBENC', verified: false, source: 'Text mention' });
  }
  if (allText.includes('mbe') || allText.includes('minority business')) {
    certifications.push({ type: 'MBE', verified: false, source: 'Text mention' });
  }
  if (allText.includes('vosb') || allText.includes('veteran')) {
    certifications.push({ type: 'VOSB', verified: false, source: 'Text mention' });
  }

  const metadata = {
    womanOwned,
    minorityOwned,
    veteranOwned,
    smallBusiness,
    localBusiness,
    certifications,
    diversityScore: 0,
    summary: 'Rule-based diversity analysis completed',
  };

  metadata.diversityScore = calculateDiversityScore(metadata);

  return metadata;
}
