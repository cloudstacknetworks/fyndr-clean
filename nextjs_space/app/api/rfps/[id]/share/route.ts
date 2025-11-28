import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendEmail } from '@/lib/email';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/rfps/[id]/share
 * Share RFP Executive Summary via email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // 2. Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: 'Email service not configured',
          message: 'RESEND_API_KEY is missing in environment variables. Please add it to your .env file.',
          docs: 'https://resend.com/docs/send-with-nextjs',
        },
        { status: 500 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { recipients, summaryHtml } = body;

    // 4. Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // 5. Validate each email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid email addresses',
          invalidEmails: invalidEmails,
        },
        { status: 400 }
      );
    }

    // 6. Validate summaryHtml
    if (!summaryHtml || typeof summaryHtml !== 'string') {
      return NextResponse.json(
        { error: 'Summary HTML is required' },
        { status: 400 }
      );
    }

    // 7. Fetch RFP to get title for email subject
    const rfp = await prisma.rFP.findUnique({
      where: { id: params.id },
      select: { title: true },
    });

    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }

    // 8. Send email using Resend
    const emailSubject = `Executive Summary: ${rfp.title}`;
    const result = await sendEmail(recipients, emailSubject, summaryHtml);

    // 9. Handle email send result
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          message: result.error,
        },
        { status: 500 }
      );
    }

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: `Summary sent to ${recipients.length} recipient(s)`,
      recipients: recipients,
    });

  } catch (error: any) {
    console.error('Share API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
