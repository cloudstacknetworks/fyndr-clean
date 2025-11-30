'use client';

import { signOut } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';
import SupplierBellIcon from './bell-icon';

export default function SupplierLayout({
  session,
  children,
}: {
  session: any;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Supplier Portal Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Fyndr
              </h1>
              <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                Supplier Portal
              </span>
            </div>

            {/* User Info & Sign Out */}
            <div className="flex items-center space-x-4">
              {/* STEP 22: Notification Bell Icon */}
              <SupplierBellIcon />
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{session.user.email}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Fyndr Supplier Portal - Read-Only RFP Access
          </p>
        </div>
      </footer>
    </div>
  );
}
