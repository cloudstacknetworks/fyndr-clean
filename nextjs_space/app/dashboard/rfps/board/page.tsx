import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import KanbanBoard from './kanban-board';
import Link from 'next/link';

export default async function RFPBoardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Fetch all RFPs for the current user with related data
  const rfps = await prisma.rFP.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      stage: true,
      priority: true,
      dueDate: true,
      enteredStageAt: true,
      stageEnteredAt: true,
      stageSlaDays: true,
      opportunityScore: true,
      company: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      {/* Header with List View button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RFP Pipeline</h1>
          <p className="text-gray-500 mt-1">Drag and drop to update status</p>
        </div>
        <Link
          href="/dashboard/rfps"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          List View
        </Link>
      </div>

      {/* Kanban Board */}
      <KanbanBoard initialRfps={rfps} />
    </div>
  );
}
