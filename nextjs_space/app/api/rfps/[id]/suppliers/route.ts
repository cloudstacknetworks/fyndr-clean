import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { generateSupplierInvitationEmailHtml } from '@/lib/email-templates';

const prisma = new PrismaClient();

// GET /api/rfps/[id]/suppliers - List all supplier contacts for an RFP
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { userId: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all supplier contacts for this RFP
    const supplierContacts = await prisma.supplierContact.findMany({
      where: { rfpId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ supplierContacts });
  } catch (error) {
    console.error('Error fetching supplier contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/rfps/[id]/suppliers/invite - Invite a supplier contact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rfpId = params.id;
    const body = await request.json();
    const { name, email, organization } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify RFP ownership and fetch RFP details
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        company: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if supplier contact already exists
    const existingContact = await prisma.supplierContact.findFirst({
      where: {
        rfpId,
        email,
      },
    });

    if (existingContact) {
      return NextResponse.json(
        { error: 'Supplier contact with this email already exists for this RFP' },
        { status: 400 }
      );
    }

    // Generate secure access token (32 bytes, hex)
    const accessToken = crypto.randomBytes(32).toString('hex');
    const accessTokenExpires = new Date();
    accessTokenExpires.setDate(accessTokenExpires.getDate() + 7); // 7 days from now

    // Create supplier contact
    const supplierContact = await prisma.supplierContact.create({
      data: {
        rfpId,
        name,
        email,
        organization,
        accessToken,
        accessTokenExpires,
        invitationStatus: 'PENDING',
      },
    });

    // Generate magic link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/supplier/access?token=${accessToken}`;

    // Send invitation email
    const emailHtml = generateSupplierInvitationEmailHtml(
      name,
      rfp.title,
      rfp.company.name,
      {
        askQuestionsStart: rfp.askQuestionsStart,
        askQuestionsEnd: rfp.askQuestionsEnd,
        submissionStart: rfp.submissionStart,
        submissionEnd: rfp.submissionEnd,
        awardDate: rfp.awardDate,
      },
      magicLink
    );

    const emailResult = await sendEmail({
      to: email,
      subject: `You've been invited to respond to an RFP: ${rfp.title}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Don't fail the request, but log the error
      // Update status to reflect that email wasn't sent
      await prisma.supplierContact.update({
        where: { id: supplierContact.id },
        data: {
          invitationStatus: 'PENDING',
          invitedAt: new Date(),
        },
      });

      return NextResponse.json({
        supplierContact,
        warning: 'Supplier contact created, but email failed to send',
      });
    }

    // Update supplier contact with sent status
    const updatedSupplierContact = await prisma.supplierContact.update({
      where: { id: supplierContact.id },
      data: {
        invitationStatus: 'SENT',
        invitedAt: new Date(),
      },
    });

    return NextResponse.json({
      supplierContact: updatedSupplierContact,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error inviting supplier contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
