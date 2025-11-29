import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/dashboard/rfps/[id]/responses
 * Get all supplier contacts and their response statuses for an RFP (buyer view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a buyer
    if (session.user.role !== 'buyer') {
      return NextResponse.json({ error: 'Access denied. Buyer role required.' }, { status: 403 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this RFP' },
        { status: 403 }
      );
    }

    // Fetch all supplier contacts with their response data
    const supplierContacts = await prisma.supplierContact.findMany({
      where: { rfpId },
      include: {
        supplierResponse: {
          include: {
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for UI
    const responses = supplierContacts.map((contact) => {
      const response = contact.supplierResponse;
      
      let responseStatus: 'Not Started' | 'Draft' | 'Submitted' = 'Not Started';
      if (response) {
        responseStatus = response.status === 'SUBMITTED' ? 'Submitted' : 'Draft';
      }

      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        organization: contact.organization,
        responseStatus,
        submittedAt: response?.submittedAt?.toISOString() || null,
        attachmentsCount: response?.attachments?.length || 0,
      };
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error fetching supplier responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
