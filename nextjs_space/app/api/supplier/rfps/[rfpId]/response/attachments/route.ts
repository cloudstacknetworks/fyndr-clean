import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

const prisma = new PrismaClient();

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;
// Maximum number of attachments per response
const MAX_ATTACHMENTS = 20;

/**
 * POST /api/supplier/rfps/[rfpId]/response/attachments
 * Upload attachment files for supplier response
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

    // Find or create response
    let response = await prisma.supplierResponse.findUnique({
      where: {
        supplierContactId: supplierContact.id,
      },
      include: {
        attachments: true,
      },
    });

    if (!response) {
      // Create a DRAFT response
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

    // Check if already submitted
    if (response.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Cannot add attachments to a submitted response.' },
        { status: 400 }
      );
    }

    // Check attachment limit
    if (response.attachments.length >= MAX_ATTACHMENTS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_ATTACHMENTS} attachments allowed per response.` },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const attachmentType = (formData.get('attachmentType') as string) || 'GENERAL';
    const description = (formData.get('description') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Create storage directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'supplier-responses', response.id);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(uploadDir, fileName);
    const storageKey = `supplier-responses/${response.id}/${fileName}`;

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create attachment record
    const attachment = await prisma.supplierResponseAttachment.create({
      data: {
        supplierResponseId: response.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageKey,
        attachmentType: attachmentType as any,
        description,
      },
    });

    // Return updated attachments list
    const updatedAttachments = await prisma.supplierResponseAttachment.findMany({
      where: { supplierResponseId: response.id },
      orderBy: { createdAt: 'desc' },
    });

    // Log activity
    await logActivityWithRequest(request, {
      rfpId,
      supplierResponseId: response.id,
      supplierContactId: supplierContact.id,
      userId: session.user.id,
      actorRole: ACTOR_ROLES.SUPPLIER,
      eventType: EVENT_TYPES.SUPPLIER_ATTACHMENT_UPLOADED,
      summary: `Attachment '${file.name}' uploaded`,
      details: {
        rfpId,
        supplierResponseId: response.id,
        fileName: file.name,
        fileSize: file.size,
        attachmentId: attachment.id,
        attachmentType,
      },
    });

    return NextResponse.json({ 
      attachment,
      attachments: updatedAttachments 
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
