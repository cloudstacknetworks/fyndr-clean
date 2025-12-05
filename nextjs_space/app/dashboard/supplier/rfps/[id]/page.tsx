/**
 * Step 62: Supplier Portal Enhancements
 * Page: /dashboard/supplier/rfps/[id]
 * 
 * Supplier RFP Detail workspace with 6 tabs
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import SupplierRFPDetailClient from '@/components/supplier/SupplierRFPDetailClient';

export const metadata: Metadata = {
  title: 'RFP Details | Fyndr',
  description: 'View and manage your RFP submission'
};

export default async function SupplierRFPDetailPage({
  params
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // Require authentication
  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/dashboard/supplier/rfps/' + params.id);
  }

  // Require supplier role
  if (session.user.role !== 'supplier') {
    redirect('/dashboard');
  }

  // Fetch initial summary data server-side
  let initialSummary = null;
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/dashboard/supplier/rfps/${params.id}/summary`,
      {
        headers: {
          cookie: `next-auth.session-token=${session.user.id}` // Pass session info
        }
      }
    );

    if (response.ok) {
      const result = await response.json();
      initialSummary = result.data;
    }
  } catch (error) {
    console.error('Error fetching initial summary:', error);
  }

  // If not found, show 404
  if (!initialSummary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            RFP Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The RFP you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <a
            href="/dashboard/supplier/rfps"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to My RFPs
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SupplierRFPDetailClient rfpId={params.id} initialSummary={initialSummary} />
    </div>
  );
}
