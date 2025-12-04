/**
 * Global Notifications Center Page (STEP 51)
 * 
 * Purpose: Read-only, buyer-only notifications derived from activity logs
 * Shows last 50 activity events with RFP context
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import NotificationCenter from './notification-center';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect('/login');
  }

  // Redirect suppliers to home (buyer-only feature)
  if (session.user.role !== 'buyer') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Notifications Center
        </h1>
        <p className="text-gray-600 mt-2">
          Stay up to date with recent activity across your RFPs - executive summaries, awards, scoring, compliance, and portfolio insights.
        </p>
      </div>

      <NotificationCenter />
    </div>
  );
}
