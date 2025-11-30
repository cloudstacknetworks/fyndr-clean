/**
 * API Endpoint: Supplier List Export (STEP 25)
 * Exports all suppliers for a specific RFP in CSV or Excel format
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

    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv or excel.' }, { status: 400 });
    }

    // Fetch all supplier contacts for this RFP
    const suppliers = await prisma.supplierContact.findMany({
      where: {
        rfpId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Prepare headers
    const headers = [
      'Name',
      'Email',
      'Organization',
      'Invitation Status',
      'Invited At',
      'Portal Access',
      'Response Status',
    ];

    // Prepare rows
    const rows = suppliers.map(supplier => [
      supplier.name || '',
      supplier.email || '',
      supplier.organization || '',
      supplier.invitationStatus || '',
      supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '',
      supplier.portalUserId ? 'Yes' : 'No',
      '', // Response status would need to be fetched separately if needed
    ]);

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `rfp-${rfpId}-suppliers-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'Suppliers',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `rfp-${rfpId}-suppliers-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting suppliers:', error);
    return NextResponse.json({ error: 'Failed to export suppliers' }, { status: 500 });
  }
}
