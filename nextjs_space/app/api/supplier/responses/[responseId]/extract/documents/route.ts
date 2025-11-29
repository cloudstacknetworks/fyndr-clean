import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { 
  readPdfText, 
  readWordText, 
  readPowerpointText, 
  detectFileType, 
  extractWithAI 
} from '@/lib/extraction-utils';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  req: NextRequest,
  { params }: { params: { responseId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { responseId } = params;

    // 2. Fetch SupplierResponse with RFP ownership verification
    const response = await prisma.supplierResponse.findUnique({
      where: { id: responseId },
      include: {
        rfp: true,
        attachments: {
          where: {
            attachmentType: {
              in: ['GENERAL', 'PRESENTATION', 'CONTRACT_DRAFT', 'OTHER']
            }
          }
        }
      }
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // 3. Verify RFP ownership
    if (response.rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Verify response is SUBMITTED
    if (response.status !== 'SUBMITTED') {
      return NextResponse.json({ 
        error: 'Can only extract from submitted responses' 
      }, { status: 400 });
    }

    // 5. Extract text from document files
    const documents: any[] = [];
    
    for (const attachment of response.attachments) {
      const filePath = path.join(process.cwd(), attachment.storageKey);
      const fileType = detectFileType(attachment.fileName);
      
      let textContent = '';
      
      try {
        switch (fileType) {
          case 'pdf':
            textContent = await readPdfText(filePath);
            break;
          case 'word':
            textContent = await readWordText(filePath);
            break;
          case 'powerpoint':
            textContent = await readPowerpointText(filePath);
            break;
          default:
            textContent = 'Unsupported file type';
        }
        
        if (textContent && textContent.length > 100) {
          documents.push({
            fileName: attachment.fileName,
            fileType,
            textContent: textContent.substring(0, 10000) // Limit text length
          });
        }
      } catch (error) {
        console.error(`Error reading ${attachment.fileName}:`, error);
      }
    }

    // 6. If no documents to analyze
    if (documents.length === 0) {
      return NextResponse.json({
        extracted: {
          message: 'No document files to analyze',
          technicalClaims: {},
          assumptions: {},
          risks: {},
          differentiators: {}
        }
      }, { status: 200 });
    }

    // 7. Aggregate all text content
    const aggregatedText = documents
      .map(doc => `[${doc.fileName}]\n${doc.textContent}`)
      .join('\n\n---\n\n');

    // 8. Use AI to extract different aspects
    const extractions: any = {
      filesAnalyzed: documents.length,
      fileNames: documents.map(d => d.fileName)
    };

    try {
      // Extract technical claims
      const technicalClaims = await extractWithAI('technical', aggregatedText, openai);
      extractions.technicalClaims = technicalClaims;
    } catch (error) {
      console.error('Technical claims extraction error:', error);
      extractions.technicalClaims = { error: 'Extraction failed' };
    }

    try {
      // Extract assumptions
      const assumptions = await extractWithAI('assumptions', aggregatedText, openai);
      extractions.assumptions = assumptions;
    } catch (error) {
      console.error('Assumptions extraction error:', error);
      extractions.assumptions = { error: 'Extraction failed' };
    }

    try {
      // Extract risks
      const risks = await extractWithAI('risks', aggregatedText, openai);
      extractions.risks = risks;
    } catch (error) {
      console.error('Risks extraction error:', error);
      extractions.risks = { error: 'Extraction failed' };
    }

    try {
      // Extract differentiators
      const differentiators = await extractWithAI('differentiators', aggregatedText, openai);
      extractions.differentiators = differentiators;
    } catch (error) {
      console.error('Differentiators extraction error:', error);
      extractions.differentiators = { error: 'Extraction failed' };
    }

    // 9. Store extracted data in respective fields
    const updated = await prisma.supplierResponse.update({
      where: { id: responseId },
      data: {
        extractedTechnicalClaims: extractions.technicalClaims,
        extractedAssumptions: extractions.assumptions,
        extractedRisks: extractions.risks,
        extractedDifferentiators: extractions.differentiators,
        extractedFilesMetadata: {
          filesAnalyzed: extractions.filesAnalyzed,
          fileNames: extractions.fileNames,
          extractedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      extracted: {
        technicalClaims: updated.extractedTechnicalClaims,
        assumptions: updated.extractedAssumptions,
        risks: updated.extractedRisks,
        differentiators: updated.extractedDifferentiators,
        metadata: updated.extractedFilesMetadata
      }
    });

  } catch (error) {
    console.error('Documents extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
