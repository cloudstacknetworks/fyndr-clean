'use client';

import { User, Shield, CheckCircle } from 'lucide-react';

interface DashboardClientProps {
  session: any;
}

export default function DashboardClient({ session }: DashboardClientProps) {
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="ml-5">
              <h2 className="text-2xl font-bold text-white">Welcome to your Dashboard</h2>
              <p className="text-indigo-100 mt-1 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Successfully authenticated
              </p>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <dl className="grid grid-cols-1 gap-6">
            <div className="border-l-4 border-indigo-500 pl-4 py-2">
              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <User className="w-4 h-4 mr-2 text-indigo-600" />
                Email Address
              </dt>
              <dd className="text-base text-gray-900 font-medium">
                {session?.user?.email || 'N/A'}
              </dd>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                <Shield className="w-4 h-4 mr-2 text-blue-600" />
                User ID
              </dt>
              <dd className="text-base text-gray-900 font-mono bg-gray-50 inline-block px-3 py-1 rounded">
                {session?.user?.id || 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Info Section */}
        <div className="px-8 pb-8">
          <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold text-indigo-900 mb-1">Protected Content</h3>
                <p className="text-sm text-indigo-700">
                  This dashboard is only accessible to authenticated users. Your session is secure and managed by NextAuth.js with industry-standard security practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
