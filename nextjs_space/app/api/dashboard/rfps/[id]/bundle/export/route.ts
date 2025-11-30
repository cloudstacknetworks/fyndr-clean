/**
 * API Endpoint: Complete RFP Bundle Export (STEP 27)
 * Exports all RFP data in a single streaming ZIP bundle
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import {
  generateCsv,
  generateExcel,
  generateTimelinePdf,
  generateComparisonPdf,
  generateSupplierResponsePdf,
  generatePdfFromHtml
} from '@/lib/export-utils';
import archiver from 'archiver';
import { Readable } from 'stream';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "buyer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rfpId = params.id;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        company: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!rfp || rfp.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all related data
    const [
      suppliers,
      responses,
      questions,
      broadcasts,
      tasks,
      activityLogs
    ] = await Promise.all([
      prisma.supplierContact.findMany({
        where: { rfpId }
      }),
      prisma.supplierResponse.findMany({
        where: { rfpId },
        include: {
          supplierContact: true,
          attachments: true
        }
      }),
      prisma.supplierQuestion.findMany({
        where: { rfpId },
        include: { supplierContact: { select: { name: true } } }
      }),
      prisma.supplierBroadcastMessage.findMany({
        where: { rfpId }
      }),
      prisma.stageTask.findMany({
        where: { rfpId }
      }),
      prisma.activityLog.findMany({
        where: { rfpId },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 6 } // Compression level
    });

    // Create readable stream for response
    const stream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        archive.on("end", () => {
          controller.close();
        });
        archive.on("error", (err) => {
          controller.error(err);
        });
      }
    });

    // Start building ZIP in background
    (async () => {
      try {
        // 00-RFP-Metadata
        const rfpMetadata = sanitizeRfpData(rfp);
        archive.append(JSON.stringify(rfpMetadata, null, 2), {
          name: "00-RFP-Metadata/rfp.json"
        });

        // Generate RFP summary PDF
        const rfpSummaryPdf = await generateRfpSummaryPdf(rfp);
        archive.append(rfpSummaryPdf, {
          name: "00-RFP-Metadata/rfp-summary.pdf"
        });

        // Timeline exports
        const timelineCsv = generateTimelineCsv(rfp);
        const timelineExcel = generateTimelineExcel(rfp);
        const timelinePdf = await generateTimelinePdf(rfp);
        archive.append(timelineCsv, { name: "00-RFP-Metadata/timeline.csv" });
        archive.append(timelineExcel, { name: "00-RFP-Metadata/timeline.xlsx" });
        archive.append(timelinePdf, { name: "00-RFP-Metadata/timeline.pdf" });

        // 01-Suppliers
        const suppliersCsv = generateSuppliersCsv(suppliers);
        const suppliersExcel = generateSuppliersExcel(suppliers);
        archive.append(suppliersCsv, { name: "01-Suppliers/suppliers.csv" });
        archive.append(suppliersExcel, { name: "01-Suppliers/suppliers.xlsx" });

        // 02-Supplier-Responses
        for (const response of responses) {
          const supplierName = sanitizeFilename(response.supplierContact.name);
          const contactId = response.supplierContactId;
          const baseDir = `02-Supplier-Responses/${supplierName}-${contactId}`;

          // Response JSON (sanitized)
          const responseJson = sanitizeResponseData(response);
          archive.append(JSON.stringify(responseJson, null, 2), {
            name: `${baseDir}/response.json`
          });

          // Structured CSV/Excel
          const structuredCsv = generateResponseCsv(response);
          const structuredExcel = generateResponseExcel(response);
          archive.append(structuredCsv, { name: `${baseDir}/structured.csv` });
          archive.append(structuredExcel, { name: `${baseDir}/structured.xlsx` });

          // Narrative PDF (if available)
          if (response.structuredAnswers) {
            try {
              const narrativePdf = await generateSupplierResponsePdf({
                supplierName: response.supplierContact.name,
                supplierEmail: response.supplierContact.email,
                rfpTitle: rfp.title,
                structuredAnswers: response.structuredAnswers,
                submittedAt: response.submittedAt
              });
              archive.append(narrativePdf, { name: `${baseDir}/narrative.pdf` });
            } catch (pdfError) {
              console.error("Error generating narrative PDF:", pdfError);
            }
          }

          // Attachments metadata
          if (response.attachments && response.attachments.length > 0) {
            const attachmentsList = response.attachments.map(att => ({
              fileName: att.fileName,
              fileType: att.fileType,
              attachmentType: att.attachmentType,
              uploadedAt: att.createdAt
            }));
            archive.append(JSON.stringify(attachmentsList, null, 2), {
              name: `${baseDir}/attachments-list.json`
            });
          }
        }

        // 03-QA
        const qaCsv = generateQaCsv(questions);
        const qaExcel = generateQaExcel(questions);
        const broadcastsCsv = generateBroadcastsCsv(broadcasts);
        const broadcastsExcel = generateBroadcastsExcel(broadcasts);
        archive.append(qaCsv, { name: "03-QA/qa.csv" });
        archive.append(qaExcel, { name: "03-QA/qa.xlsx" });
        archive.append(broadcastsCsv, { name: "03-QA/broadcasts.csv" });
        archive.append(broadcastsExcel, { name: "03-QA/broadcasts.xlsx" });

        // 04-Tasks
        const tasksCsv = generateTasksCsv(tasks);
        const tasksExcel = generateTasksExcel(tasks);
        archive.append(tasksCsv, { name: "04-Tasks/tasks.csv" });
        archive.append(tasksExcel, { name: "04-Tasks/tasks.xlsx" });

        // 05-Comparison (if exists)
        if (rfp.comparisonNarrative) {
          const comparisonData = {
            rfp: rfp,
            comparisons: responses.filter(r => r.status === 'SUBMITTED').map(r => ({
              supplierName: r.supplierContact.name,
              supplierEmail: r.supplierContact.email,
              supplierOrganization: r.supplierContact.organization,
              comparisonScore: r.comparisonScore,
              readinessIndicator: r.readinessIndicator
            }))
          };
          
          try {
            const comparisonPdf = await generateComparisonPdf(comparisonData);
            archive.append(comparisonPdf, { name: "05-Comparison/comparison.pdf" });
          } catch (pdfError) {
            console.error("Error generating comparison PDF:", pdfError);
          }

          // Narrative
          if (rfp.comparisonNarrative) {
            archive.append(JSON.stringify(rfp.comparisonNarrative, null, 2), {
              name: "05-Comparison/narrative.json"
            });
          }
        }

        // 06-Activity
        const activityCsv = generateActivityCsv(activityLogs);
        archive.append(activityCsv, { name: "06-Activity/activity.csv" });

        // 99-System
        const exportInfo = {
          generatedAt: new Date().toISOString(),
          rfpId: rfp.id,
          version: "1.0",
          exportedByUserId: session.user.id,
          totalSuppliers: suppliers.length,
          totalResponses: responses.length,
          totalQuestions: questions.length,
          totalTasks: tasks.length,
          elapsedMilliseconds: Date.now() - startTime
        };
        archive.append(JSON.stringify(exportInfo, null, 2), {
          name: "99-System/export-info.json"
        });

        // Finalize archive
        await archive.finalize();
      } catch (error) {
        console.error("Bundle export error:", error);
        archive.abort();
      }
    })();

    // Return streaming response
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `rfp-${rfpId}-bundle-${timestamp}.zip`;

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Bundle export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper functions
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}

function sanitizeRfpData(rfp: any): any {
  const { user, company, ...sanitized } = rfp;
  return {
    ...sanitized,
    ownerName: user?.name,
    ownerEmail: user?.email,
    companyName: company?.name
  };
}

function sanitizeResponseData(response: any): any {
  const { portalToken, supplierContact, attachments, ...sanitized } = response;
  return {
    ...sanitized,
    supplierName: supplierContact?.name,
    supplierEmail: supplierContact?.email,
    supplierOrganization: supplierContact?.organization,
    attachmentCount: attachments?.length || 0
  };
}

async function generateRfpSummaryPdf(rfp: any): Promise<Buffer> {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not Set';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20mm; }
          h1 { color: #4F46E5; }
          .metadata { margin-top: 20px; }
          .metadata-item { margin-bottom: 10px; }
          strong { color: #4F46E5; }
        </style>
      </head>
      <body>
        <h1>RFP Summary</h1>
        <div class="metadata">
          <div class="metadata-item"><strong>Title:</strong> ${rfp.title}</div>
          <div class="metadata-item"><strong>Status:</strong> ${rfp.status}</div>
          <div class="metadata-item"><strong>Stage:</strong> ${rfp.stage}</div>
          <div class="metadata-item"><strong>Created:</strong> ${formatDate(rfp.createdAt)}</div>
          <div class="metadata-item"><strong>Description:</strong> ${rfp.description || 'N/A'}</div>
        </div>
      </body>
    </html>
  `;
  return generatePdfFromHtml(html);
}

function generateTimelineCsv(rfp: any): string {
  const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString() : 'Not Set';
  const headers = ["Milestone", "Start Date", "End Date"];
  const rows = [
    ["Q&A Window", formatDate(rfp.askQuestionsStart), formatDate(rfp.askQuestionsEnd)],
    ["Submission Window", formatDate(rfp.submissionStart), formatDate(rfp.submissionEnd)],
    ["Demo Window", formatDate(rfp.demoWindowStart), formatDate(rfp.demoWindowEnd)],
    ["Award Date", formatDate(rfp.awardDate), "N/A"]
  ];
  return generateCsv(headers, rows);
}

function generateTimelineExcel(rfp: any): Buffer {
  const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString() : 'Not Set';
  const headers = ["Milestone", "Start Date", "End Date"];
  const rows = [
    ["Q&A Window", formatDate(rfp.askQuestionsStart), formatDate(rfp.askQuestionsEnd)],
    ["Submission Window", formatDate(rfp.submissionStart), formatDate(rfp.submissionEnd)],
    ["Demo Window", formatDate(rfp.demoWindowStart), formatDate(rfp.demoWindowEnd)],
    ["Award Date", formatDate(rfp.awardDate), "N/A"]
  ];
  return generateExcel({ sheets: [{ name: "Timeline", headers, rows }] });
}

function generateSuppliersCsv(suppliers: any[]): string {
  const headers = ["Name", "Email", "Organization", "Invitation Status", "Invited At"];
  const rows = suppliers.map(s => [
    s.name,
    s.email,
    s.organization || "N/A",
    s.invitationStatus,
    s.invitedAt ? new Date(s.invitedAt).toLocaleDateString() : "N/A"
  ]);
  return generateCsv(headers, rows);
}

function generateSuppliersExcel(suppliers: any[]): Buffer {
  const headers = ["Name", "Email", "Organization", "Invitation Status", "Invited At"];
  const rows = suppliers.map(s => [
    s.name,
    s.email,
    s.organization || "N/A",
    s.invitationStatus,
    s.invitedAt ? new Date(s.invitedAt).toLocaleDateString() : "N/A"
  ]);
  return generateExcel({ sheets: [{ name: "Suppliers", headers, rows }] });
}

function generateResponseCsv(response: any): string {
  const answers = response.structuredAnswers || {};
  const headers = ["Field", "Value"];
  const rows = Object.entries(answers).map(([key, value]) => [key, value]);
  return generateCsv(headers, rows);
}

function generateResponseExcel(response: any): Buffer {
  const answers = response.structuredAnswers || {};
  const headers = ["Field", "Value"];
  const rows = Object.entries(answers).map(([key, value]) => [key, value]);
  return generateExcel({ sheets: [{ name: "Response", headers, rows }] });
}

function generateQaCsv(questions: any[]): string {
  const headers = ["Question", "Answer", "Supplier", "Status", "Asked At", "Answered At"];
  const rows = questions.map(q => [
    q.question,
    q.answer || "N/A",
    q.supplierContact?.name || "N/A",
    q.status,
    q.askedAt ? new Date(q.askedAt).toLocaleDateString() : "N/A",
    q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : "N/A"
  ]);
  return generateCsv(headers, rows);
}

function generateQaExcel(questions: any[]): Buffer {
  const headers = ["Question", "Answer", "Supplier", "Status", "Asked At", "Answered At"];
  const rows = questions.map(q => [
    q.question,
    q.answer || "N/A",
    q.supplierContact?.name || "N/A",
    q.status,
    q.askedAt ? new Date(q.askedAt).toLocaleDateString() : "N/A",
    q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : "N/A"
  ]);
  return generateExcel({ sheets: [{ name: "Q&A", headers, rows }] });
}

function generateBroadcastsCsv(broadcasts: any[]): string {
  const headers = ["Message", "Sent At"];
  const rows = broadcasts.map(b => [
    b.message,
    b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "N/A"
  ]);
  return generateCsv(headers, rows);
}

function generateBroadcastsExcel(broadcasts: any[]): Buffer {
  const headers = ["Message", "Sent At"];
  const rows = broadcasts.map(b => [
    b.message,
    b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "N/A"
  ]);
  return generateExcel({ sheets: [{ name: "Broadcasts", headers, rows }] });
}

function generateTasksCsv(tasks: any[]): string {
  const headers = ["Title", "Stage", "Completed", "Completed At", "Created At"];
  const rows = tasks.map(t => [
    t.title,
    t.stage,
    t.completed ? "Yes" : "No",
    t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "N/A",
    t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "N/A"
  ]);
  return generateCsv(headers, rows);
}

function generateTasksExcel(tasks: any[]): Buffer {
  const headers = ["Title", "Stage", "Completed", "Completed At", "Created At"];
  const rows = tasks.map(t => [
    t.title,
    t.stage,
    t.completed ? "Yes" : "No",
    t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "N/A",
    t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "N/A"
  ]);
  return generateExcel({ sheets: [{ name: "Tasks", headers, rows }] });
}

function generateActivityCsv(logs: any[]): string {
  const headers = ["Event Type", "Actor", "Summary", "Created At"];
  const rows = logs.map(log => [
    log.eventType,
    log.actorRole,
    log.summary,
    log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "N/A"
  ]);
  return generateCsv(headers, rows);
}
