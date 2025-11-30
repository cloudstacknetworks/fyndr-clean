/**
 * Supplier Notification Center Client Component
 * STEP 22: Notifications & Reminders Engine
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, BellDot, Check, Clock, ArrowLeft } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  readAt: Date | null;
  createdAt: Date;
  rfpId: string | null;
}

interface Props {
  initialNotifications: Notification[];
}

export default function SupplierNotificationCenter({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const router = useRouter();

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date() } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    // Navigate to RFP if rfpId exists
    if (notification.rfpId) {
      router.push(`/supplier/rfps/${notification.rfpId}`);
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'RFP_TIMELINE':
        return 'bg-blue-100 text-blue-700';
      case 'SUPPLIER_QA':
        return 'bg-purple-100 text-purple-700';
      case 'SUPPLIER_RESPONSE':
        return 'bg-green-100 text-green-700';
      case 'READINESS':
        return 'bg-amber-100 text-amber-700';
      case 'SYSTEM':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No notifications yet
        </h3>
        <p className="text-gray-600 mb-6">
          You'll see notifications here when there are updates on your RFPs.
        </p>
        <Link
          href="/supplier"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 transition cursor-pointer hover:bg-gray-50 ${
              !notification.readAt ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {!notification.readAt ? (
                  <BellDot className="h-6 w-6 text-indigo-600" />
                ) : (
                  <Bell className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={`text-sm font-semibold ${
                      !notification.readAt ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {notification.title}
                  </p>
                  {!notification.readAt && (
                    <span className="inline-flex items-center justify-center w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {notification.message.length > 150
                    ? `${notification.message.substring(0, 150)}...`
                    : notification.message}
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      getCategoryColor(notification.category)
                    }`}
                  >
                    {notification.category.replace('_', ' ')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {getRelativeTime(notification.createdAt)}
                  </span>
                </div>
              </div>
              {!notification.readAt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Mark as read"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/supplier/settings/notifications"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Manage notification preferences →
        </Link>
      </div>
    </div>
  );
}
