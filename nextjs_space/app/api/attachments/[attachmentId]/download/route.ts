import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * GET /api/attachments/[attachmentId]/download
 * Download an attachment file (accessible to supplier who owns it or buyer who owns the RFP)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attachmentId } = params;

    // Find the attachment with related data
    const attachment = await prisma.supplierResponseAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        supplierResponse: {
          include: {
            rfp: true,
            supplierContact: true,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Verify access
    const isSupplier = session.user.role === 'supplier' && 
      attachment.supplierResponse.supplierContact.portalUserId === session.user.id;
    
    const isBuyer = session.user.role === 'buyer' && 
      attachment.supplierResponse.rfp.userId === session.user.id;

    if (!isSupplier && !isBuyer) {
      return NextResponse.json(
        { error: 'You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // Read file from disk
    const filePath = path.join(process.cwd(), 'uploads', attachment.storageKey);
    const fileBuffer = await readFile(filePath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.fileType,
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
