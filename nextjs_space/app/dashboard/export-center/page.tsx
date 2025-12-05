/**
 * STEP 63: Export Center Page
 * Centralized export management for buyers
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { getExportRegistry } from '@/lib/exports/export-registry';
import ExportCenterClient from './components/ExportCenterClient';

export const metadata = {
  title: 'Export Center | Fyndr',
  description: 'Generate and download reports, summaries, and files across all RFPs'
};

export default async function ExportCenterPage() {
  const session = await getServerSession(authOptions);
  
  // Authentication check
  if (!session) {
    redirect('/auth/signin');
  }
  
  // Buyer-only access
  if (session.user.role !== 'buyer') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">
              The Export Center is only available to buyers.
            </p>
            <a
              href="/dashboard"
              className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Get all exports from registry
  const exports = getExportRegistry();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8" data-demo="export-center-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Export Center</h1>
          <p className="mt-2 text-gray-600">
            Generate and download reports, summaries, and files across all RFPs.
          </p>
        </div>
        
        <ExportCenterClient exports={exports} />
      </div>
    </div>
  );
}
