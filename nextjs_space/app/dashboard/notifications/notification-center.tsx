/**
 * Global Notifications Center Client Component (STEP 51)
 * 
 * Features:
 * - Read-only notification feed from activity logs
 * - Category filtering (All, Executive Summaries, Awards, Scoring, Compliance, Portfolio)
 * - RFP context with clickable links
 * - Relative timestamps
 * - Empty state handling
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Clock, FileText, Award, BarChart3, CheckCircle, Briefcase, AlertCircle } from 'lucide-react';

interface NotificationItem {
  id: string;
  eventType: string;
  description: string;
  rfpId: string | null;
  rfpTitle: string | null;
  timestamp: Date;
  category: string;
}

interface NotificationFeedData {
  notifications: NotificationItem[];
  total: number;
}

// Category configuration
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'executive_summary', label: 'Executive Summaries', icon: FileText },
  { id: 'award', label: 'Awards', icon: Award },
  { id: 'ai_processing', label: 'Scoring', icon: BarChart3 },
  { id: 'archive', label: 'Compliance', icon: CheckCircle },
  { id: 'comparison', label: 'Portfolio', icon: Briefcase },
];

export default function NotificationCenter() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationData, setNotificationData] = useState<NotificationFeedData>({
    notifications: [],
    total: 0,
  });
  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch notifications from API
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }

        const data: NotificationFeedData = await response.json();
        setNotificationData(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Unable to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  // Filter notifications by category
  const filteredNotifications = notificationData.notifications.filter((notification) => {
    if (activeCategory === 'all') return true;
    return notification.category.toLowerCase() === activeCategory.toLowerCase();
  });

  // Get relative time string
  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return date.toLocaleDateString();
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'executive_summary':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'award':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ai_processing':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'archive':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'comparison':
        return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
      case 'dashboard':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-12 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to load notifications
        </h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (notificationData.total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No notifications yet
        </h3>
        <p className="text-gray-600 mb-6">
          You'll see notifications here when there are updates on executive summaries, awards, scoring, compliance, and portfolio insights.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Category Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const count = category.id === 'all' 
              ? notificationData.total 
              : notificationData.notifications.filter(n => n.category.toLowerCase() === category.id.toLowerCase()).length;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No notifications in this category
          </h3>
          <p className="text-gray-600">
            Try selecting a different category to view more notifications.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className="p-5 hover:bg-gray-50 transition"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        getCategoryColor(notification.category)
                      }`}
                    >
                      {notification.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {getRelativeTime(notification.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 font-medium mb-1">
                    {notification.description}
                  </p>

                  {notification.rfpId && notification.rfpTitle && (
                    <Link
                      href={`/dashboard/rfps/${notification.rfpId}`}
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 hover:underline mt-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {notification.rfpTitle}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Showing {filteredNotifications.length} of {notificationData.total} notifications
      </div>
    </div>
  );
}
