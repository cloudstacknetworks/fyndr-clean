import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * DELETE /api/supplier/responses/[responseId]/attachments/[attachmentId]
 * Delete an attachment (only allowed in DRAFT status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { responseId: string; attachmentId: string } }
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

    const { responseId, attachmentId } = params;

    // Find the response and verify ownership
    const response = await prisma.supplierResponse.findUnique({
      where: { id: responseId },
      include: {
        supplierContact: true,
      },
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Verify this supplier owns the response
    if (response.supplierContact.portalUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this response' },
        { status: 403 }
      );
    }

    // Check if response is already submitted
    if (response.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Cannot delete attachments from a submitted response.' },
        { status: 400 }
      );
    }

    // Find the attachment
    const attachment = await prisma.supplierResponseAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Verify attachment belongs to this response
    if (attachment.supplierResponseId !== responseId) {
      return NextResponse.json(
        { error: 'Attachment does not belong to this response' },
        { status: 400 }
      );
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'uploads', attachment.storageKey);
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file from disk:', fileError);
      // Continue even if file deletion fails
    }

    // Delete attachment record
    await prisma.supplierResponseAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
