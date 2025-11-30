import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as fs from "fs/promises";
import * as path from "path";

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

    // Fetch attachment with authorization check (same as /meta)
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

    // Authorization check (same as /meta)
    const rfp = attachment.supplierResponse.rfp;
    const supplierContact = attachment.supplierResponse.supplierContact;

    if (session.user.role === "buyer") {
      if (rfp.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "supplier") {
      if (supplierContact.portalUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch file from storage
    const fileBuffer = await fetchFileFromStorage(attachment.storageKey);
    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    const ext = attachment.fileName.split(".").pop()?.toLowerCase();

    // DOCX
    if (ext === "docx") {
      const result = await mammoth.convertToHtml({ buffer: fileBuffer });
      return NextResponse.json({ html: result.value });
    }

    // TXT
    if (ext === "txt") {
      const text = fileBuffer.toString("utf-8");
      return NextResponse.json({ text });
    }

    // Markdown
    if (ext === "md") {
      const markdown = fileBuffer.toString("utf-8");
      return NextResponse.json({ markdown });
    }

    // CSV
    if (ext === "csv") {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      return NextResponse.json({ sheets: [{ name: sheetName, rows }] });
    }

    // XLSX
    if (["xlsx", "xls"].includes(ext || "")) {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheets = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        return { name, rows };
      });
      return NextResponse.json({ sheets });
    }

    // PPTX (simplified text extraction)
    if (ext === "pptx") {
      // For PPTX, we'll return a placeholder since full extraction is complex
      // In a production system, you'd use a library like pptx-extractor or similar
      return NextResponse.json({ 
        slides: [{
          title: "PPTX Preview",
          bullets: ["PPTX text extraction requires additional processing", "Download the file to view full content"]
        }]
      });
    }

    return NextResponse.json({ error: "Unsupported file type for text extraction" }, { status: 400 });
  } catch (error) {
    console.error("Text extraction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchFileFromStorage(storageKey: string): Promise<Buffer | null> {
  try {
    // Construct the file path - attachments are stored in uploads/attachments/
    const filePath = path.join(process.cwd(), "uploads", "attachments", storageKey);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.error(`File not found at ${filePath}`);
      return null;
    }
    
    // Read the file
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error("Error fetching file from storage:", error);
    return null;
  }
}
