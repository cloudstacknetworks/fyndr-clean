/**
 * API Endpoint: Q&A Export (STEP 25)
 * Exports all questions and answers for a specific RFP in CSV or Excel format
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

    // Fetch all questions
    const questions = await prisma.supplierQuestion.findMany({
      where: {
        rfpId,
      },
      include: {
        supplierContact: true,
      },
      orderBy: {
        askedAt: 'desc',
      },
    });

    // Fetch all broadcasts
    const broadcasts = await prisma.supplierBroadcastMessage.findMany({
      where: {
        rfpId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Prepare headers
    const headers = [
      'Type',
      'Question/Message',
      'Answer',
      'Supplier Name',
      'Status',
      'Asked/Sent At',
      'Answered At',
    ];

    // Prepare rows - questions first
    const questionRows = questions.map(q => [
      'Question',
      q.question || '',
      q.answer || '',
      q.supplierContact?.name || '',
      q.status || '',
      q.askedAt ? new Date(q.askedAt).toLocaleString() : '',
      q.answeredAt ? new Date(q.answeredAt).toLocaleString() : '',
    ]);

    // Then broadcast messages
    const broadcastRows = broadcasts.map(b => [
      'Broadcast',
      b.message || '',
      '',
      'All Suppliers',
      '',
      b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
      '',
    ]);

    const rows = [...questionRows, ...broadcastRows];

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `rfp-${rfpId}-qa-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'Q&A',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `rfp-${rfpId}-qa-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting Q&A:', error);
    return NextResponse.json({ error: 'Failed to export Q&A' }, { status: 500 });
  }
}
