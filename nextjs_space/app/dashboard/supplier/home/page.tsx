/**
 * STEP 54: Supplier Work Inbox & Notifications Panel
 * Server component for supplier dashboard home page
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import SupplierInboxClient from './components/SupplierInboxClient';

export default async function SupplierHomePage() {
  const session = await getServerSession(authOptions);
  
  // Validate authentication
  if (!session || !session.user) {
    redirect('/login');
  }
  
  // Enforce supplier role - redirect buyers to their dashboard
  if (session.user.role !== 'supplier') {
    redirect('/dashboard/home');
  }
  
  // Fetch inbox data directly from engine (server-side)
  // More efficient than API call from server to server
  try {
    const { buildSupplierInbox } = await import('@/lib/supplier-inbox/supplier-inbox-engine');
    const { logActivity } = await import('@/lib/activity-log');
    const { EVENT_TYPES, ACTOR_ROLES } = await import('@/lib/activity-types');
    
    const inboxData = await buildSupplierInbox(session.user.id);
    
    // Log activity
    await logActivity({
      userId: session.user.id,
      eventType: EVENT_TYPES.SUPPLIER_INBOX_VIEWED,
      actorRole: ACTOR_ROLES.SUPPLIER,
      summary: `Supplier viewed work inbox`,
      details: {
        userId: session.user.id,
        pendingActionsCount: inboxData.counts.pendingActionsCount,
        deadlinesCount: inboxData.counts.deadlinesCount,
        invitationsCount: inboxData.counts.invitationsCount,
        activityCount: inboxData.counts.activityCount
      }
    });
    
    return <SupplierInboxClient initialData={inboxData} />;
    
  } catch (error) {
    console.error('[SUPPLIER_HOME_PAGE] Error:', error);
    
    // Return client component with empty data on error
    return <SupplierInboxClient initialData={null} />;
  }
}
