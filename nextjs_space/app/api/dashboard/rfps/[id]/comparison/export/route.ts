/**
 * API Endpoint: Comparison Export (STEP 25)
 * Exports supplier comparison results in CSV, Excel, or PDF format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateCsv, generateExcel, generateComparisonPdf, downloadCsv, downloadExcel, downloadPdf } from '@/lib/export-utils';

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

    // Fetch comparison results
    const supplierResponses = await prisma.supplierResponse.findMany({
      where: {
        supplierContact: {
          rfpId,
        },
        status: 'SUBMITTED',
      },
      include: {
        supplierContact: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (supplierResponses.length === 0) {
      return NextResponse.json({ error: 'No submitted responses found for comparison' }, { status: 404 });
    }

    if (format === 'pdf') {
      // Generate PDF with comparison data
      const comparisons = supplierResponses.map(r => ({
        supplierName: r.supplierContact?.name || 'Unknown',
        supplierEmail: r.supplierContact?.email || '',
        supplierOrganization: r.supplierContact?.organization || '',
        totalScore: 0, // Score would come from comparison run
        breakdown: null,
      }));

      const pdfBuffer = await generateComparisonPdf({
        rfp,
        comparisons,
      });
      return downloadPdf(pdfBuffer, `rfp-${rfpId}-comparison-${Date.now()}.pdf`);
    }

    // For CSV/Excel, create a table with scores
    const headers = [
      'Rank',
      'Supplier Name',
      'Email',
      'Organization',
      'Response Status',
      'Readiness',
    ];

    const rows = supplierResponses.map((r, index) => [
      (index + 1).toString(),
      r.supplierContact?.name || '',
      r.supplierContact?.email || '',
      r.supplierContact?.organization || '',
      r.status || '',
      r.readinessIndicator || '',
    ]);

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `rfp-${rfpId}-comparison-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'Comparison',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `rfp-${rfpId}-comparison-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting comparison:', error);
    return NextResponse.json({ error: 'Failed to export comparison' }, { status: 500 });
  }
}
