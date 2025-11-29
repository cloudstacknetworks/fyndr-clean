import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { readExcelToJson, detectFileType, extractWithAI } from '@/lib/extraction-utils';
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
            attachmentType: 'REQUIREMENTS_MATRIX'
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

    // 5. Check if there are requirements matrix attachments
    if (response.attachments.length === 0) {
      return NextResponse.json({
        error: 'No requirements matrix attachments found',
        extracted: {
          message: 'No requirements files to analyze',
          requirements: [],
          coveragePercentage: 0
        }
      }, { status: 200 });
    }

    // 6. Extract data from requirements matrices
    const extractedData: any[] = [];
    
    for (const attachment of response.attachments) {
      const filePath = path.join(process.cwd(), attachment.storageKey);
      const fileType = detectFileType(attachment.fileName);
      
      if (fileType === 'excel') {
        try {
          const excelData = await readExcelToJson(filePath);
          extractedData.push({
            fileName: attachment.fileName,
            sheets: excelData.sheets
          });
        } catch (error) {
          console.error(`Error reading ${attachment.fileName}:`, error);
        }
      }
    }

    // 7. Use AI to analyze requirements coverage
    let aiExtraction: any = null;
    if (extractedData.length > 0) {
      try {
        aiExtraction = await extractWithAI('requirements', extractedData, openai);
        
        // Ensure we have a coverage percentage
        if (aiExtraction && !aiExtraction.coveragePercentage) {
          const requirements = aiExtraction.requirements || [];
          const meetsCount = requirements.filter((r: any) => 
            r.complianceLevel === 'Meets'
          ).length;
          aiExtraction.coveragePercentage = requirements.length > 0 
            ? Math.round((meetsCount / requirements.length) * 100)
            : 0;
        }
      } catch (error) {
        console.error('AI extraction error:', error);
        aiExtraction = {
          error: 'AI extraction failed',
          rawData: extractedData,
          coveragePercentage: 0
        };
      }
    }

    // 8. Store extracted data
    const updated = await prisma.supplierResponse.update({
      where: { id: responseId },
      data: {
        extractedRequirementsCoverage: aiExtraction || { 
          message: 'No requirements data extracted',
          rawFiles: extractedData.length,
          coveragePercentage: 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      extracted: updated.extractedRequirementsCoverage
    });

  } catch (error) {
    console.error('Requirements extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
