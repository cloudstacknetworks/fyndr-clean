'use client';

/**
 * STEP 50: Buyer Home Dashboard & Work Queue UI
 * Main landing page for buyers showing active RFPs, deadlines, and attention items
 */

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

import type { HomeDashboardData, RfpCardData, WorkQueueItem, AttentionItem, RecentActivityItem } from '@/lib/dashboard/home-dashboard-engine';

export default function BuyerHomeDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<HomeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/home');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load dashboard');
        }
        const { data } = await res.json();
        setDashboardData(data);
      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadDashboard();
    }
  }, [status]);

  // ========================================
  // Loading State
  // ========================================
  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // ========================================
  // Error State
  // ========================================
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">No dashboard data available.</div>
      </div>
    );
  }

  const { stats, myRfps, upcomingDeadlines, attentionItems, recentActivity } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ========================================
          SECTION 1: Header
          ======================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HomeIcon className="h-8 w-8 text-blue-600" />
            Home Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {session?.user?.name || session?.user?.email}! Here's your RFP overview.
          </p>
        </div>
      </div>

      {/* ========================================
          SECTION 2: Stats Tiles (4 KPIs)
          ======================================== */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active RFPs */}
        <StatTile
          title="Active RFPs"
          value={stats.activeCount}
          icon={<ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />

        {/* Due Soon */}
        <StatTile
          title="Due Soon (30 days)"
          value={stats.dueSoonCount}
          icon={<ClockIcon className="h-6 w-6 text-orange-600" />}
          bgColor="bg-orange-50"
        />

        {/* In Evaluation */}
        <StatTile
          title="In Evaluation"
          value={stats.inEvaluationCount}
          icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />}
          bgColor="bg-purple-50"
        />

        {/* Awarded Recently */}
        <StatTile
          title="Awarded (6 mo)"
          value={stats.awardedRecentCount}
          icon={<TrophyIcon className="h-6 w-6 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Avg Cycle Time (optional sub-stat) */}
      {stats.avgCycleTimeDays !== null && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold">Average Cycle Time:</span>
            <span className="text-indigo-700 font-bold">{stats.avgCycleTimeDays} days</span>
            <span className="text-gray-500">(from creation to award)</span>
          </div>
        </div>
      )}

      {/* ========================================
          SECTION 3: Work Queue (Upcoming Deadlines)
          ======================================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-orange-600" />
            Work Queue — Upcoming Deadlines
          </h2>
          {upcomingDeadlines.length > 0 && (
            <span className="text-sm text-gray-500">{upcomingDeadlines.length} items</span>
          )}
        </div>

        {upcomingDeadlines.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm mt-1">No RFPs with deadlines in the next 30 days.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFP Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phase
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingDeadlines.map((item) => (
                  <WorkQueueRow key={item.rfpId} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========================================
          SECTION 4: Attention Items (Missing Pieces)
          ======================================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            Needs Attention
          </h2>
          {attentionItems.length > 0 && (
            <span className="text-sm text-gray-500">{attentionItems.length} items</span>
          )}
        </div>

        {attentionItems.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium">Everything is on track!</p>
            <p className="text-sm mt-1">No immediate action items at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attentionItems.map((item, idx) => (
              <AttentionItemCard key={`${item.rfpId}-${item.type}-${idx}`} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================
          SECTION 5: My Active RFPs (Card Grid)
          ======================================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
            My Active RFPs
          </h2>
          {myRfps.length > 0 && (
            <span className="text-sm text-gray-500">{myRfps.length} RFPs</span>
          )}
        </div>

        {myRfps.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium">No active RFPs</p>
            <p className="text-sm mt-1">Create a new RFP to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRfps.map((rfp) => (
              <RfpCard key={rfp.id} rfp={rfp} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================
          SECTION 6: Recent Activity
          ======================================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          {recentActivity.length > 0 && (
            <span className="text-sm text-gray-500">{recentActivity.length} updates</span>
          )}
        </div>

        {recentActivity.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            <p className="text-sm">No recent activity to display.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {recentActivity.map((item, idx) => (
              <RecentActivityRow key={`${item.rfpId}-${idx}`} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ========================================
// Sub-Components
// ========================================

interface StatTileProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

function StatTile({ title, value, icon, bgColor }: StatTileProps) {
  return (
    <div className={`${bgColor} rounded-lg border border-gray-200 p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
    </div>
  );
}

interface WorkQueueRowProps {
  item: WorkQueueItem;
}

function WorkQueueRow({ item }: WorkQueueRowProps) {
  const router = useRouter();
  
  const urgencyColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };

  const urgencyLabels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const daysUntilDue = Math.ceil((item.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${urgencyColors[item.urgency]}`}>
          {urgencyLabels[item.urgency]}
        </span>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => router.push(`/dashboard/rfp/${item.rfpId}`)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
        >
          {item.title}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.phase}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}>
          {item.dueDate.toLocaleDateString()}
        </div>
        <div className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
          {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => router.push(`/dashboard/rfp/${item.rfpId}`)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View RFP →
        </button>
      </td>
    </tr>
  );
}

interface AttentionItemCardProps {
  item: AttentionItem;
}

function AttentionItemCard({ item }: AttentionItemCardProps) {
  const router = useRouter();
  
  const typeIcons = {
    decision_brief: <DocumentTextIcon className="h-5 w-5 text-orange-600" />,
    scoring_matrix: <ChartBarIcon className="h-5 w-5 text-purple-600" />,
    exec_summary: <DocumentTextIcon className="h-5 w-5 text-indigo-600" />,
    award: <TrophyIcon className="h-5 w-5 text-emerald-600" />,
  };

  const typeLabels = {
    decision_brief: 'Decision Brief',
    scoring_matrix: 'Scoring Matrix',
    exec_summary: 'Executive Summary',
    award: 'Award Decision',
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{typeIcons[item.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              {typeLabels[item.type]}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <button
              onClick={() => router.push(`/dashboard/rfp/${item.rfpId}`)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {item.rfpTitle}
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-2">{item.reason}</p>
          <button
            onClick={() => router.push(`/dashboard/rfp/${item.rfpId}`)}
            className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {item.suggestedNextAction} →
          </button>
        </div>
      </div>
    </div>
  );
}

interface RfpCardProps {
  rfp: RfpCardData;
}

function RfpCard({ rfp }: RfpCardProps) {
  const router = useRouter();

  const phaseColors: Record<string, string> = {
    'Planning': 'bg-gray-100 text-gray-700',
    'Intake': 'bg-blue-100 text-blue-700',
    'Qualification': 'bg-indigo-100 text-indigo-700',
    'Discovery': 'bg-purple-100 text-purple-700',
    'Invitation': 'bg-pink-100 text-pink-700',
    'Q&A': 'bg-orange-100 text-orange-700',
    'Submission': 'bg-amber-100 text-amber-700',
    'Evaluation': 'bg-yellow-100 text-yellow-700',
    'Demo': 'bg-lime-100 text-lime-700',
    'Award': 'bg-green-100 text-green-700',
    'Awarded': 'bg-emerald-100 text-emerald-700',
    'Debrief': 'bg-teal-100 text-teal-700',
    'Cancelled': 'bg-red-100 text-red-700',
  };

  const phaseColor = phaseColors[rfp.phase] || 'bg-gray-100 text-gray-700';

  const isOverdue = rfp.daysOverdue !== null && rfp.daysOverdue > 0;
  const isDueSoon = rfp.daysUntilDue !== null && rfp.daysUntilDue <= 7;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => router.push(`/dashboard/rfp/${rfp.id}`)}
          className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left flex-1"
        >
          {rfp.title}
        </button>
      </div>

      {/* Description */}
      {rfp.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rfp.description}</p>
      )}

      {/* Phase & Budget */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${phaseColor}`}>
          {rfp.phase}
        </span>
        {rfp.budget && (
          <span className="text-xs text-gray-500">
            Budget: ${rfp.budget.toLocaleString()}
          </span>
        )}
      </div>

      {/* Due Date */}
      {rfp.dueDate && (
        <div className={`text-sm mb-3 ${isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
          <ClockIcon className="inline h-4 w-4 mr-1" />
          {isOverdue && `${rfp.daysOverdue} days overdue`}
          {isDueSoon && !isOverdue && `Due in ${rfp.daysUntilDue} days`}
          {!isOverdue && !isDueSoon && `Due ${rfp.dueDate.toLocaleDateString()}`}
        </div>
      )}

      {/* Completion Indicators */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        {rfp.hasDecisionBrief ? (
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4" /> Brief
          </span>
        ) : (
          <span className="text-gray-400">Brief</span>
        )}
        {rfp.hasScoringMatrix ? (
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4" /> Matrix
          </span>
        ) : (
          <span className="text-gray-400">Matrix</span>
        )}
        {rfp.isAwarded ? (
          <span className="text-green-600 flex items-center gap-1">
            <TrophyIcon className="h-4 w-4" /> Awarded
          </span>
        ) : (
          <span className="text-gray-400">Award</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/dashboard/rfp/${rfp.id}`)}
          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

interface RecentActivityRowProps {
  item: RecentActivityItem;
}

function RecentActivityRow({ item }: RecentActivityRowProps) {
  const router = useRouter();

  const timeAgo = getTimeAgo(item.lastUpdatedAt);

  return (
    <div className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/rfp/${item.rfpId}`)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-500 mt-1">{item.indicator}</p>
        </div>
        <div className="text-xs text-gray-400">{timeAgo}</div>
      </div>
    </div>
  );
}

// ========================================
// Utility Functions
// ========================================

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}
