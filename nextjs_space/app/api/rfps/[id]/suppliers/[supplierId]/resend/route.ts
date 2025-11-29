import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { generateSupplierInvitationEmailHtml } from '@/lib/email-templates';

const prisma = new PrismaClient();

// POST /api/rfps/[id]/suppliers/[supplierId]/resend - Resend invitation to a supplier contact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; supplierId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;

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

    // Verify supplier contact exists and belongs to this RFP
    const supplierContact = await prisma.supplierContact.findUnique({
      where: { id: supplierId },
    });

    if (!supplierContact) {
      return NextResponse.json(
        { error: 'Supplier contact not found' },
        { status: 404 }
      );
    }

    if (supplierContact.rfpId !== rfpId) {
      return NextResponse.json(
        { error: 'Supplier contact does not belong to this RFP' },
        { status: 400 }
      );
    }

    // Check if invitation was already accepted
    if (supplierContact.invitationStatus === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Cannot resend invitation - supplier has already accepted and logged in' },
        { status: 400 }
      );
    }

    // Generate new access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    const accessTokenExpires = new Date();
    accessTokenExpires.setDate(accessTokenExpires.getDate() + 7); // 7 days from now

    // Update supplier contact with new token
    await prisma.supplierContact.update({
      where: { id: supplierId },
      data: {
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
      supplierContact.name,
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
      to: supplierContact.email,
      subject: `Reminder: You've been invited to respond to an RFP: ${rfp.title}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to resend invitation email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    // Update supplier contact with sent status
    const updatedSupplierContact = await prisma.supplierContact.update({
      where: { id: supplierId },
      data: {
        invitationStatus: 'SENT',
        invitedAt: new Date(),
      },
    });

    return NextResponse.json({
      supplierContact: updatedSupplierContact,
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
