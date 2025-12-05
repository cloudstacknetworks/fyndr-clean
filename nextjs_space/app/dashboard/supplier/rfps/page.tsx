/**
 * Step 62: Supplier Portal Enhancements
 * Page: /dashboard/supplier/rfps
 * 
 * "My RFPs" overview page for suppliers
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import SupplierRFPListClient from '@/components/supplier/SupplierRFPListClient';

export const metadata: Metadata = {
  title: 'My RFPs | Fyndr',
  description: 'View all RFPs you have been invited to participate in'
};

export default async function SupplierRFPsPage() {
  const session = await getServerSession(authOptions);

  // Require authentication
  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/dashboard/supplier/rfps');
  }

  // Require supplier role
  if (session.user.role !== 'supplier') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8" data-demo="supplier-my-rfps">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My RFPs
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            RFPs you&apos;ve been invited to participate in.
          </p>
        </div>

        {/* Client component for filters and table */}
        <SupplierRFPListClient />
      </div>
    </div>
  );
}
