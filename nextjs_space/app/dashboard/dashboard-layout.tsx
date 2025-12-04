'use client';

import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, FileText, Building2, Users, Settings, LayoutDashboard, ChevronLeft, ChevronRight, Search, TrendingUp, GitBranch, Home, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import GlobalSearch from './global-search';
import CommandPalette from './command-palette';
import BellIcon from './bell-icon';
import { SearchBar } from '../components/search-bar';
import GlobalSearchBar from '../components/global-search-bar';
import { DemoButton } from '../components/demo/demo-button';

interface DashboardLayoutProps {
  session: any;
  children: React.ReactNode;
}

type NavMode = 'sidebar' | 'topbar' | 'both';
type SidebarMode = 'expanded' | 'collapsed';

export default function DashboardLayout({ session, children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [navMode, setNavMode] = useState<NavMode>('both');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('expanded');
  const [isClient, setIsClient] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('navMode') as NavMode;
      if (storedMode && ['sidebar', 'topbar', 'both'].includes(storedMode)) {
        setNavMode(storedMode);
      }
      
      const storedSidebarMode = localStorage.getItem('sidebarMode') as SidebarMode;
      if (storedSidebarMode && ['expanded', 'collapsed'].includes(storedSidebarMode)) {
        setSidebarMode(storedSidebarMode);
      }
    }
  }, []);

  // Global keyboard shortcut for Command Palette (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.replace('/');
  };

  const handleToggleNav = () => {
    const modes: NavMode[] = ['both', 'sidebar', 'topbar'];
    const currentIndex = modes.indexOf(navMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setNavMode(nextMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('navMode', nextMode);
    }
  };

  const handleToggleSidebar = () => {
    const newMode: SidebarMode = sidebarMode === 'expanded' ? 'collapsed' : 'expanded';
    setSidebarMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarMode', newMode);
    }
  };

  const getToggleTooltip = () => {
    switch (navMode) {
      case 'both':
        return 'Both navigations (click for sidebar only)';
      case 'sidebar':
        return 'Sidebar only (click for topbar only)';
      case 'topbar':
        return 'Topbar only (click for both)';
      default:
        return 'Toggle Navigation Layout';
    }
  };

  const sidebarNavigation = [
    { name: 'Home', href: '/dashboard/home', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Portfolio', href: '/dashboard/portfolio', icon: TrendingUp },
    { name: 'Lifecycle Board', href: '/dashboard/rfps/lifecycle', icon: GitBranch },
    { name: 'RFPs', href: '/dashboard/rfps', icon: FileText },
    { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
    { name: 'Suppliers', href: '/dashboard/suppliers', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const topNavigation = [
    { name: 'Home', href: '/dashboard/home' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Notifications', href: '/dashboard/notifications' },
    { name: 'Portfolio', href: '/dashboard/portfolio' },
    { name: 'Lifecycle', href: '/dashboard/rfps/lifecycle' },
    { name: 'RFPs', href: '/dashboard/rfps' },
    { name: 'Companies', href: '/dashboard/companies' },
    { name: 'Suppliers', href: '/dashboard/suppliers' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/dashboard/home') {
      return pathname === '/dashboard/home';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  // Helper function to check if a string is a UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Helper function to convert segment to readable label
  const segmentToLabel = (segment: string): string => {
    const labelMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'home': 'Home',
      'notifications': 'Notifications',
      'rfps': 'RFPs',
      'companies': 'Companies',
      'suppliers': 'Suppliers',
      'settings': 'Settings',
      'new': 'Create',
      'edit': 'Edit',
    };

    // Check if it's a known segment
    if (labelMap[segment]) {
      return labelMap[segment];
    }

    // Check if it's a UUID
    if (isUUID(segment)) {
      return 'Details';
    }

    // Fallback: capitalize first letter
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Function to generate breadcrumb items
  const getBreadcrumbs = () => {
    if (!pathname) return [];

    // Remove trailing slash if present
    const cleanPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;

    // Split the path into segments
    const segments = cleanPath.split('/').filter(Boolean);

    // Build breadcrumb items
    const breadcrumbs = segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');
      const label = segmentToLabel(segment);
      const isLast = index === segments.length - 1;

      return {
        label,
        path,
        isLast,
      };
    });

    return breadcrumbs;
  };

  // Function to generate page title based on current pathname
  const getPageTitle = (): string => {
    if (!pathname) return 'Dashboard';

    // Remove trailing slash if present
    const cleanPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;

    // Split the path into segments
    const segments = cleanPath.split('/').filter(Boolean);

    // Handle root dashboard
    if (segments.length === 1 && segments[0] === 'dashboard') {
      return 'Dashboard';
    }

    // Handle dashboard routes
    if (segments[0] === 'dashboard' && segments.length > 1) {
      const section = segments[1];
      const action = segments[2];
      const subAction = segments[3];

      // RFPs routes
      if (section === 'rfps') {
        if (!action) return 'RFP List';
        if (action === 'new') return 'Create New RFP';
        if (isUUID(action)) {
          if (!subAction) return 'RFP Details';
          if (subAction === 'edit') return 'Edit RFP';
        }
      }

      // Companies routes
      if (section === 'companies') {
        if (!action) return 'Company List';
        if (action === 'new') return 'Create Company';
        if (isUUID(action)) {
          if (!subAction) return 'Company Details';
          if (subAction === 'edit') return 'Edit Company';
        }
      }

      // Suppliers routes
      if (section === 'suppliers') {
        if (!action) return 'Supplier List';
        if (action === 'new') return 'Create Supplier';
        if (isUUID(action)) {
          if (!subAction) return 'Supplier Details';
          if (subAction === 'edit') return 'Edit Supplier';
        }
      }

      // Notifications route (STEP 51)
      if (section === 'notifications') {
        return 'Notifications Center';
      }

      // Settings route
      if (section === 'settings') {
        return 'Settings';
      }
    }

    // Fallback to capitalized last segment
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const showTopbar = navMode === 'topbar' || navMode === 'both';
  const showSidebar = navMode === 'sidebar' || navMode === 'both';

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
              <span className="text-sm text-gray-600 hidden md:block">{session?.user?.email}</span>
              
              {/* STEP 48: Global Search Engine */}
              <GlobalSearchBar />
              
              {/* STEP 22: Notification Bell Icon */}
              <BellIcon />
              
              {/* STEP 32: Demo Button */}
              <DemoButton variant="buyer" />
              
              {/* Navigation Toggle Button */}
              <div className="relative group">
                <button
                  onClick={handleToggleNav}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  title={getToggleTooltip()}
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                {/* Tooltip */}
                {isClient && (
                  <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {getToggleTooltip()}
                  </div>
                )}
              </div>

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
      {showTopbar && (
        <div className="bg-white shadow-md border-b border-gray-200 transition-all duration-300 ease-in-out">
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
      )}

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <aside className={`bg-white shadow-md min-h-[calc(100vh-7.5rem)] transition-all duration-300 ease-in-out ${
            sidebarMode === 'expanded' ? 'w-64' : 'w-20'
          }`}>
            {/* Chevron Toggle Button */}
            <div className={`flex items-center p-4 border-b border-gray-200 ${
              sidebarMode === 'collapsed' ? 'justify-center' : 'justify-end'
            }`}>
              <button
                onClick={handleToggleSidebar}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                title={sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarMode === 'expanded' ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <nav className="p-4 space-y-2">
              {sidebarNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <div key={item.name} className="relative group">
                    <Link
                      href={item.href}
                      className={`flex items-center text-sm font-medium rounded-md transition-colors ${
                        sidebarMode === 'expanded' ? 'px-4 py-3' : 'px-3 py-3 justify-center'
                      } ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${sidebarMode === 'expanded' ? 'mr-3' : ''}`} />
                      {sidebarMode === 'expanded' && <span>{item.name}</span>}
                    </Link>
                    
                    {/* Tooltip for collapsed mode */}
                    {sidebarMode === 'collapsed' && isClient && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        {item.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 p-8 transition-all duration-300 ease-in-out ${!showSidebar ? 'ml-0' : ''}`}>
          {/* Breadcrumbs */}
          <div className="-mx-8 -mt-8 px-8 pt-4 pb-2">
            <nav className="flex items-center space-x-2 text-sm">
              {getBreadcrumbs().map((breadcrumb, index) => (
                <div key={breadcrumb.path} className="flex items-center">
                  {index > 0 && (
                    <span className="text-gray-400 mx-2">&gt;</span>
                  )}
                  {breadcrumb.isLast ? (
                    <span className="text-gray-700 font-medium">
                      {breadcrumb.label}
                    </span>
                  ) : (
                    <Link
                      href={breadcrumb.path}
                      className="text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                    >
                      {breadcrumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Page Title Bar */}
          <div className="bg-white border-b border-gray-200 -mx-8 mb-6 px-8 py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>
          
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
