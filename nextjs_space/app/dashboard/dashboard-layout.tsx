'use client';

import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, FileText, Building2, Users, Settings } from 'lucide-react';

interface DashboardLayoutProps {
  session: any;
  children: React.ReactNode;
}

export default function DashboardLayout({ session, children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.replace('/');
  };

  const sidebarNavigation = [
    { name: 'RFPs', href: '/dashboard/rfps', icon: FileText },
    { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
    { name: 'Suppliers', href: '/dashboard/suppliers', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const topNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'RFPs', href: '/dashboard/rfps' },
    { name: 'Companies', href: '/dashboard/companies' },
    { name: 'Suppliers', href: '/dashboard/suppliers' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
                Fyndr
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Top Navigation */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-8 h-14">
            {topNavigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative text-sm transition-all duration-200 py-4 ${
                    active
                      ? 'font-bold text-indigo-600'
                      : 'font-normal text-gray-700 hover:text-indigo-500'
                  } group`}
                >
                  {item.name}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 transform transition-all duration-200 ${
                      active
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100 group-hover:bg-indigo-400'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-7.5rem)]">
          <nav className="p-4 space-y-2">
            {sidebarNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
