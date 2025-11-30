/**
 * API Endpoint: RFP List Export (STEP 25)
 * Exports all RFPs owned by the buyer in CSV or Excel format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateCsv, generateExcel, downloadCsv, downloadExcel } from '@/lib/export-utils';
import { STAGE_LABELS } from '@/lib/stages';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get format from query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv or excel.' }, { status: 400 });
    }

    // Fetch all RFPs for this user
    const rfps = await prisma.rFP.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        company: true,
        supplier: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Prepare headers
    const headers = [
      'ID',
      'Title',
      'Status',
      'Stage',
      'SLA Days',
      'Opportunity Score',
      'Timeline (Q&A Start)',
      'Created At',
    ];

    // Prepare rows
    const rows = rfps.map(rfp => [
      rfp.id,
      rfp.title || '',
      rfp.status || '',
      STAGE_LABELS[rfp.stage] || rfp.stage,
      rfp.stageSlaDays?.toString() || '',
      rfp.opportunityScore?.toString() || '',
      rfp.askQuestionsStart ? new Date(rfp.askQuestionsStart).toLocaleDateString() : '',
      new Date(rfp.createdAt).toLocaleDateString(),
    ]);

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `rfps-export-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'RFPs',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `rfps-export-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting RFPs:', error);
    return NextResponse.json({ error: 'Failed to export RFPs' }, { status: 500 });
  }
}
