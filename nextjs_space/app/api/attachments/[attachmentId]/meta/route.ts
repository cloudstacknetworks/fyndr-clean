import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { logActivityWithRequest } from "@/lib/activity-log";
import { EVENT_TYPES, ACTOR_ROLES } from "@/lib/activity-types";

export async function GET(
  req: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attachmentId = params.attachmentId;

    // Fetch attachment with related data
    const attachment = await prisma.supplierResponseAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        supplierResponse: {
          include: {
            supplierContact: true,
            rfp: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Authorization check
    const rfp = attachment.supplierResponse.rfp;
    const supplierContact = attachment.supplierResponse.supplierContact;

    if (session.user.role === "buyer") {
      // Buyer must own the RFP
      if (rfp.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "supplier") {
      // Supplier must own the response
      if (supplierContact.portalUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine preview capability
    const { canPreview, safePreviewType } = determinePreviewType(
      attachment.fileName,
      attachment.fileType
    );

    // Log preview event
    await logActivityWithRequest(req, {
      eventType: EVENT_TYPES.ATTACHMENT_PREVIEWED,
      actorRole: session.user.role === "buyer" ? ACTOR_ROLES.BUYER : ACTOR_ROLES.SUPPLIER,
      rfpId: rfp.id,
      userId: session.user.id,
      supplierContactId: supplierContact.id,
      summary: `Previewed attachment: ${attachment.fileName}`,
      details: {
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        fileType: safePreviewType,
        fileSize: attachment.fileSize
      }
    });

    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      attachmentType: attachment.attachmentType,
      fileSize: attachment.fileSize,
      createdAt: attachment.createdAt,
      canPreview,
      safePreviewType
    });
  } catch (error) {
    console.error("Attachment meta error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function determinePreviewType(fileName: string, fileType: string): {
  canPreview: boolean;
  safePreviewType: string;
} {
  const ext = fileName.split(".").pop()?.toLowerCase();

  // PDF
  if (ext === "pdf" || fileType === "application/pdf") {
    return { canPreview: true, safePreviewType: "pdf" };
  }

  // Word
  if (["docx", "doc"].includes(ext || "") || fileType.includes("word")) {
    return { canPreview: true, safePreviewType: "word" };
  }

  // Excel
  if (["xlsx", "xls"].includes(ext || "") || fileType.includes("spreadsheet")) {
    return { canPreview: true, safePreviewType: "excel" };
  }

  // CSV
  if (ext === "csv" || fileType === "text/csv") {
    return { canPreview: true, safePreviewType: "csv" };
  }

  // PowerPoint
  if (["pptx", "ppt"].includes(ext || "") || fileType.includes("presentation")) {
    return { canPreview: true, safePreviewType: "ppt" };
  }

  // Images
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "") || fileType.startsWith("image/")) {
    return { canPreview: true, safePreviewType: "image" };
  }

  // Video
  if (["mp4", "webm"].includes(ext || "") || fileType.startsWith("video/")) {
    return { canPreview: true, safePreviewType: "video" };
  }

  // Text
  if (ext === "txt" || fileType === "text/plain") {
    return { canPreview: true, safePreviewType: "text" };
  }

  // Markdown
  if (ext === "md" || fileType === "text/markdown") {
    return { canPreview: true, safePreviewType: "markdown" };
  }

  return { canPreview: false, safePreviewType: "unsupported" };
}
