/**
 * API Endpoint: Supplier Own Response Export (STEP 25)
 * Allows suppliers to export their own response in CSV or Excel format (NO PDF)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateCsv, generateExcel, downloadCsv, downloadExcel } from '@/lib/export-utils';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: rfpId } = params;

    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'supplier') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get format from query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    // Suppliers can only export CSV or Excel, NOT PDF
    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv or excel.' }, { status: 400 });
    }

    // Find supplier contact for this user and RFP
    const supplierContact = await prisma.supplierContact.findFirst({
      where: {
        rfpId,
        portalUserId: session.user.id,
      },
      include: {
        supplierResponse: {
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!supplierContact || !supplierContact.supplierResponse) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    const response = supplierContact.supplierResponse;

    // Only allow export if response is SUBMITTED
    if (response.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Response must be submitted before export' }, { status: 400 });
    }

    // Prepare tabular data
    const structuredAnswers = response.structuredAnswers as any || {};
    
    const headers = [
      'Field',
      'Value',
    ];

    const rows = [
      ['Your Name', supplierContact.name || ''],
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
      ['Notes', response.notesFromSupplier || ''],
      ['Attachments', response.attachments.map((a: any) => `${a.fileName} (${a.fileType})`).join(', ')],
    ];

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `my-response-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'My Response',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `my-response-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting supplier response:', error);
    return NextResponse.json({ error: 'Failed to export response' }, { status: 500 });
  }
}
