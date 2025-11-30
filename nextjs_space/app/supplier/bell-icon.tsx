/**
 * Supplier Bell Icon with Unread Count
 * STEP 22: Notifications & Reminders Engine
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, BellDot } from 'lucide-react';

export default function SupplierBellIcon() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href="/supplier/notifications"
      className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
      title="Notifications"
    >
      {unreadCount > 0 ? (
        <BellDot className="h-6 w-6" />
      ) : (
        <Bell className="h-6 w-6" />
      )}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
