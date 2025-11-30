import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

/**
 * Run all extraction endpoints sequentially
 * This is a convenience endpoint that calls all individual extractors
 */
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

    // 2. Verify SupplierResponse exists and user has access
    const response = await prisma.supplierResponse.findUnique({
      where: { id: responseId },
      include: {
        rfp: true
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

    // 5. Run all extractors sequentially
    const results: any = {
      responseId,
      extractionStartedAt: new Date().toISOString(),
      extractions: {}
    };

    // Helper function to call extraction endpoints
    const callExtractor = async (type: string) => {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/supplier/responses/${responseId}/extract/${type}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || ''
          }
        });
        
        const data = await response.json();
        return {
          success: response.ok,
          data: data.extracted || data,
          error: response.ok ? null : data.error
        };
      } catch (error) {
        console.error(`Error in ${type} extraction:`, error);
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    };

    // Run all extractors
    console.log('Running pricing extraction...');
    results.extractions.pricing = await callExtractor('pricing');
    
    console.log('Running requirements extraction...');
    results.extractions.requirements = await callExtractor('requirements');
    
    console.log('Running documents extraction...');
    results.extractions.documents = await callExtractor('documents');
    
    console.log('Running demo extraction...');
    results.extractions.demo = await callExtractor('demo');

    results.extractionCompletedAt = new Date().toISOString();

    // 6. Fetch the updated response with all extracted data
    const updatedResponse = await prisma.supplierResponse.findUnique({
      where: { id: responseId },
      select: {
        extractedPricing: true,
        extractedRequirementsCoverage: true,
        extractedTechnicalClaims: true,
        extractedAssumptions: true,
        extractedRisks: true,
        extractedDifferentiators: true,
        extractedDemoSummary: true,
        extractedFilesMetadata: true
      }
    });

    // Log activity
    await logActivityWithRequest(req, {
      rfpId: response.rfpId,
      supplierResponseId: responseId,
      userId: session.user.id,
      actorRole: ACTOR_ROLES.SYSTEM,
      eventType: EVENT_TYPES.AI_EXTRACTION_RUN,
      summary: 'AI extraction completed for response',
      details: {
        rfpId: response.rfpId,
        supplierResponseId: responseId,
        extractedFieldCount: updatedResponse ? Object.keys(updatedResponse).filter(k => updatedResponse[k as keyof typeof updatedResponse] !== null).length : 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All extractions completed',
      results,
      extracted: updatedResponse
    });

  } catch (error) {
    console.error('All extractions error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
