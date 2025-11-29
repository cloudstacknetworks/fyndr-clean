import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/supplier/rfps/[rfpId]/response/submit
 * Submit final response (sets status to SUBMITTED and locks editing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { rfpId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a supplier
    if (session.user.role !== 'supplier') {
      return NextResponse.json({ error: 'Access denied. Supplier role required.' }, { status: 403 });
    }

    const { rfpId } = params;

    // Find SupplierContact for this user and RFP
    const supplierContact = await prisma.supplierContact.findFirst({
      where: {
        rfpId,
        portalUserId: session.user.id,
      },
    });

    if (!supplierContact) {
      return NextResponse.json(
        { error: 'You do not have access to this RFP' },
        { status: 403 }
      );
    }

    // Find existing response
    let response = await prisma.supplierResponse.findUnique({
      where: {
        supplierContactId: supplierContact.id,
      },
      include: {
        attachments: true,
      },
    });

    // Create if doesn't exist
    if (!response) {
      response = await prisma.supplierResponse.create({
        data: {
          rfpId,
          supplierContactId: supplierContact.id,
          status: 'DRAFT',
        },
        include: {
          attachments: true,
        },
      });
    }

    // If already submitted, just return current response
    if (response.status === 'SUBMITTED') {
      return NextResponse.json({ response });
    }

    // Basic validation: require some content or at least one attachment
    const hasStructuredContent = response.structuredAnswers && 
      Object.values(response.structuredAnswers as Record<string, any>).some(
        (value) => typeof value === 'string' && value.trim().length > 0
      );
    
    const hasAttachments = response.attachments.length > 0;
    const hasNotes = response.notesFromSupplier && response.notesFromSupplier.trim().length > 0;

    if (!hasStructuredContent && !hasAttachments && !hasNotes) {
      return NextResponse.json(
        { error: 'Cannot submit an empty response. Please add some content or attachments.' },
        { status: 400 }
      );
    }

    // Submit the response
    const submittedResponse = await prisma.supplierResponse.update({
      where: { id: response.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json({ response: submittedResponse });
  } catch (error) {
    console.error('Error submitting supplier response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
