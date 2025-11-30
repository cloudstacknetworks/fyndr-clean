import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

const prisma = new PrismaClient();

/**
 * GET /api/supplier/rfps/[rfpId]/response
 * Get current supplier response with attachments
 */
export async function GET(
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
    const response = await prisma.supplierResponse.findUnique({
      where: {
        supplierContactId: supplierContact.id,
      },
      include: {
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!response) {
      // No response yet - return empty state
      return NextResponse.json({
        response: null,
        attachments: [],
      });
    }

    return NextResponse.json({
      response,
      attachments: response.attachments,
    });
  } catch (error) {
    console.error('Error fetching supplier response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supplier/rfps/[rfpId]/response
 * Save draft response (create or update)
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
    const body = await request.json();
    const { structuredAnswers, notesFromSupplier } = body;

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
    const existingResponse = await prisma.supplierResponse.findUnique({
      where: {
        supplierContactId: supplierContact.id,
      },
    });

    // Check if already submitted
    if (existingResponse?.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Response has already been submitted and cannot be edited.' },
        { status: 400 }
      );
    }

    let response;

    if (existingResponse) {
      // Update existing draft
      response = await prisma.supplierResponse.update({
        where: { id: existingResponse.id },
        data: {
          structuredAnswers,
          notesFromSupplier,
        },
        include: {
          attachments: true,
        },
      });
    } else {
      // Create new draft
      response = await prisma.supplierResponse.create({
        data: {
          rfpId,
          supplierContactId: supplierContact.id,
          status: 'DRAFT',
          structuredAnswers,
          notesFromSupplier,
        },
        include: {
          attachments: true,
        },
      });
    }

    // Log activity
    await logActivityWithRequest(request, {
      rfpId,
      supplierResponseId: response.id,
      supplierContactId: supplierContact.id,
      userId: session.user.id,
      actorRole: ACTOR_ROLES.SUPPLIER,
      eventType: EVENT_TYPES.SUPPLIER_RESPONSE_SAVED_DRAFT,
      summary: 'Response draft saved',
      details: {
        rfpId,
        supplierResponseId: response.id,
        supplierContactId: supplierContact.id,
        isUpdate: !!existingResponse,
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error saving supplier response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
