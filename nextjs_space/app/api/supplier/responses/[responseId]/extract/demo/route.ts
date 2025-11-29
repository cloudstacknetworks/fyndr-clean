import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { transcribeVideo, detectFileType, extractWithAI } from '@/lib/extraction-utils';
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
            attachmentType: 'DEMO_RECORDING'
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

    // 5. Check for demo link in structured answers or demo video attachments
    const structuredAnswers = response.structuredAnswers as any;
    const demoLink = structuredAnswers?.demoLink;
    const demoAttachments = response.attachments;

    if (!demoLink && demoAttachments.length === 0) {
      return NextResponse.json({
        extracted: {
          message: 'No demo video or link provided',
          overview: 'Not available',
          keyCapabilities: [],
          gapsObserved: [],
          toneAndMaturity: 'Not assessed'
        }
      }, { status: 200 });
    }

    // 6. Transcribe video or extract from link
    let transcript = '';
    const context: any = {
      rfpTitle: response.rfp.title,
      supplier: 'Supplier'
    };

    if (demoLink) {
      // For demo links, create a placeholder transcript
      transcript = `Demo video available at: ${demoLink}. Please review manually for detailed assessment.`;
      context.demoLink = demoLink;
    } else if (demoAttachments.length > 0) {
      // Try to transcribe video attachments
      for (const attachment of demoAttachments) {
        const filePath = path.join(process.cwd(), attachment.storageKey);
        const fileType = detectFileType(attachment.fileName);
        
        if (fileType === 'video') {
          try {
            const videoTranscript = await transcribeVideo(filePath, openai);
            transcript += `\n[${attachment.fileName}]\n${videoTranscript}\n`;
          } catch (error) {
            console.error(`Error transcribing ${attachment.fileName}:`, error);
            transcript += `\n[${attachment.fileName}]\nTranscription failed. Manual review recommended.\n`;
          }
        }
      }
    }

    // 7. Use AI to summarize demo
    let demoSummary: any = {
      overview: 'Unable to generate summary',
      keyCapabilities: [],
      gapsObserved: [],
      toneAndMaturity: 'Not assessed'
    };

    if (transcript && transcript.length > 50) {
      try {
        demoSummary = await extractWithAI('demo', transcript, openai, context);
      } catch (error) {
        console.error('Demo extraction error:', error);
        demoSummary.error = 'AI extraction failed';
        demoSummary.rawTranscript = transcript.substring(0, 1000);
      }
    }

    // 8. Store extracted data
    const updated = await prisma.supplierResponse.update({
      where: { id: responseId },
      data: {
        extractedDemoSummary: {
          ...demoSummary,
          demoLink: demoLink || null,
          demoFiles: demoAttachments.map(a => a.fileName),
          extractedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      extracted: updated.extractedDemoSummary
    });

  } catch (error) {
    console.error('Demo extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
