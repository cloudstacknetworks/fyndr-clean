/**
 * API Endpoint: Supplier Response Export (STEP 25)
 * Exports a specific supplier response in CSV, Excel, or PDF format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateCsv, generateExcel, generateSupplierResponsePdf, downloadCsv, downloadExcel, downloadPdf } from '@/lib/export-utils';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; supplierContactId: string } }
) {
  try {
    const { id: rfpId, supplierContactId } = params;

    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get format from query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv, excel, or pdf.' }, { status: 400 });
    }

    // Fetch supplier contact and response
    const supplierContact = await prisma.supplierContact.findUnique({
      where: { id: supplierContactId },
      include: {
        supplierResponse: {
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!supplierContact || supplierContact.rfpId !== rfpId) {
      return NextResponse.json({ error: 'Supplier contact not found' }, { status: 404 });
    }

    const response = supplierContact.supplierResponse;

    if (!response) {
      return NextResponse.json({ error: 'No response found for this supplier' }, { status: 404 });
    }

    if (format === 'pdf') {
      // Generate PDF
      const pdfBuffer = await generateSupplierResponsePdf({
        response,
        supplierContact,
        attachments: response.attachments,
      });
      return downloadPdf(pdfBuffer, `response-${supplierContactId}-${Date.now()}.pdf`);
    }

    // For CSV/Excel, prepare tabular data
    const structuredAnswers = response.structuredAnswers as any || {};
    
    const headers = [
      'Field',
      'Value',
    ];

    const rows = [
      ['Supplier Name', supplierContact.name || ''],
      ['Email', supplierContact.email || ''],
      ['Organization', supplierContact.organization || ''],
      ['Status', response.status || ''],
      ['Submitted At', response.submittedAt ? new Date(response.submittedAt).toLocaleString() : ''],
      ['Executive Summary', structuredAnswers.executiveSummary || ''],
      ['Solution Overview', structuredAnswers.solutionOverview || ''],
      ['Technical Approach', structuredAnswers.technicalApproach || ''],
      ['Implementation Plan', structuredAnswers.implementationPlan || ''],
      ['Pricing Breakdown', structuredAnswers.pricingBreakdown || ''],
      ['Team Composition', structuredAnswers.teamComposition || ''],
      ['Differentiators', structuredAnswers.differentiators || ''],
      ['References/Case Studies', structuredAnswers.references || ''],
      ['Demo Link', structuredAnswers.demoLink || ''],
      ['Notes from Supplier', response.notesFromSupplier || ''],
      ['Attachments', response.attachments.map((a: any) => `${a.fileName} (${a.fileType})`).join(', ')],
    ];

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `response-${supplierContactId}-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'Response',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `response-${supplierContactId}-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting response:', error);
    return NextResponse.json({ error: 'Failed to export response' }, { status: 500 });
  }
}
