/**
 * Supplier Notification Center Page
 * STEP 22: Notifications & Reminders Engine
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import SupplierNotificationCenter from './supplier-notification-center';

const prisma = new PrismaClient();

export default async function SupplierNotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Verify supplier role
  if (session.user.role !== 'supplier') {
    redirect('/dashboard');
  }

  // Fetch last 50 notifications for current user
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Notifications
        </h1>
        <p className="text-gray-600 mt-2">
          Stay up to date with RFP updates, deadlines, and buyer messages.
        </p>
      </div>

      <SupplierNotificationCenter initialNotifications={notifications} />
    </div>
  );
}
