/**
 * API Endpoint: Timeline Export (STEP 25)
 * Exports RFP timeline in CSV, Excel, or PDF format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateCsv, generateExcel, generateTimelinePdf, downloadCsv, downloadExcel, downloadPdf } from '@/lib/export-utils';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: rfpId } = params;

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

    if (format === 'pdf') {
      // Generate PDF for timeline
      const pdfBuffer = await generateTimelinePdf(rfp);
      return downloadPdf(pdfBuffer, `rfp-${rfpId}-timeline-${Date.now()}.pdf`);
    }

    // For CSV/Excel, prepare tabular data
    const formatDate = (date: Date | null) => {
      if (!date) return 'Not Set';
      return new Date(date).toLocaleDateString();
    };

    const headers = [
      'Milestone',
      'Start Date',
      'End Date',
    ];

    const rows = [
      ['Q&A Window', formatDate(rfp.askQuestionsStart), formatDate(rfp.askQuestionsEnd)],
      ['Submission Period', formatDate(rfp.submissionStart), formatDate(rfp.submissionEnd)],
      ['Demo Window', formatDate(rfp.demoWindowStart), formatDate(rfp.demoWindowEnd)],
      ['Award Date', formatDate(rfp.awardDate), ''],
    ];

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `rfp-${rfpId}-timeline-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'Timeline',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `rfp-${rfpId}-timeline-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting timeline:', error);
    return NextResponse.json({ error: 'Failed to export timeline' }, { status: 500 });
  }
}
