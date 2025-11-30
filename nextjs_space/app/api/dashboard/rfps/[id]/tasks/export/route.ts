/**
 * API Endpoint: Stage Tasks Export (STEP 25)
 * Exports all stage tasks for a specific RFP in CSV or Excel format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateCsv, generateExcel, downloadCsv, downloadExcel } from '@/lib/export-utils';
import { STAGE_LABELS } from '@/lib/stages';

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

    // Fetch all stage tasks
    const tasks = await prisma.stageTask.findMany({
      where: {
        rfpId,
      },
      orderBy: [
        { stage: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Prepare headers
    const headers = [
      'Task Title',
      'Stage',
      'Completed',
      'Completed At',
      'Created At',
    ];

    // Prepare rows
    const rows = tasks.map(task => [
      task.title || '',
      STAGE_LABELS[task.stage] || task.stage,
      task.completed ? 'Yes' : 'No',
      task.completedAt ? new Date(task.completedAt).toLocaleString() : '',
      task.createdAt ? new Date(task.createdAt).toLocaleString() : '',
    ]);

    if (format === 'csv') {
      const csv = generateCsv(headers, rows);
      return downloadCsv(csv, `rfp-${rfpId}-tasks-${Date.now()}.csv`);
    } else {
      const excel = generateExcel({
        sheets: [
          {
            name: 'Tasks',
            headers,
            rows,
          },
        ],
      });
      return downloadExcel(excel, `rfp-${rfpId}-tasks-${Date.now()}.xlsx`);
    }
  } catch (error) {
    console.error('Error exporting tasks:', error);
    return NextResponse.json({ error: 'Failed to export tasks' }, { status: 500 });
  }
}
