import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * GET /api/attachments/[attachmentId]/download
 * Download an attachment file (accessible to supplier who owns it or buyer who owns the RFP)
 * Supports Range headers for video streaming (206 Partial Content)
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

    // Get file path and stats
    const filePath = path.join(process.cwd(), 'uploads', attachment.storageKey);
    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;

    // Check for Range header (for video streaming)
    const range = request.headers.get('range');
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Read only the requested chunk
      const fileBuffer = await readFile(filePath);
      const chunk = fileBuffer.slice(start, end + 1);

      // Return 206 Partial Content
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': attachment.fileType,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Disposition': `inline; filename="${attachment.fileName}"`,
        },
      });
    }

    // Read full file
    const fileBuffer = await readFile(filePath);

    // Determine if file should be inline (for preview) or attachment (for download)
    const isVideo = attachment.fileType.startsWith('video/');
    const isImage = attachment.fileType.startsWith('image/');
    const isPdf = attachment.fileType === 'application/pdf';
    const disposition = (isVideo || isImage || isPdf) ? 'inline' : 'attachment';

    // Return full file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.fileType,
        'Content-Disposition': `${disposition}; filename="${attachment.fileName}"`,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
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
