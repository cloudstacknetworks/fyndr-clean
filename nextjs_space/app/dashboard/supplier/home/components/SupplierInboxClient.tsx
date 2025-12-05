/**
 * STEP 54: Supplier Work Inbox & Notifications Panel
 * Client component for supplier work inbox
 */

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  Calendar, 
  MessageSquare, 
  Activity,
  Clock,
  FileText,
  Upload,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import type { SupplierInboxData } from '@/lib/supplier-inbox/supplier-inbox-engine';

interface SupplierInboxClientProps {
  initialData: SupplierInboxData | null;
}

export default function SupplierInboxClient({ initialData }: SupplierInboxClientProps) {
  const [inboxData, setInboxData] = useState<SupplierInboxData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch data if not provided as initial data
    if (!initialData) {
      fetchInboxData();
    }
  }, [initialData]);
  
  const fetchInboxData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/supplier/home');
      
      if (!response.ok) {
        throw new Error('Failed to fetch inbox data');
      }
      
      const data = await response.json();
      setInboxData(data);
      
    } catch (err) {
      console.error('[SUPPLIER_INBOX] Error:', err);
      setError('Failed to load inbox data');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !inboxData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error || 'Failed to load inbox data'}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div data-demo="supplier-inbox-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Inbox</h1>
            <p className="text-gray-600 mt-1">
              Your central hub for managing RFP responses, tracking deadlines, and staying updated
            </p>
          </div>
          <Link
            href="/dashboard/supplier/rfps"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Inbox className="h-5 w-5" />
            View all RFPs
          </Link>
        </div>
      </div>
      
      {/* Four Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section A: Pending Actions */}
        <div 
          className="bg-white rounded-lg shadow"
          data-demo="supplier-inbox-actions"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Pending Actions
              </h2>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {inboxData.counts.pendingActionsCount}
              </span>
            </div>
            
            {inboxData.pendingActions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No pending actions</p>
                <p className="text-sm mt-1">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inboxData.pendingActions.map((action, idx) => (
                  <Link
                    key={idx}
                    href={action.link}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {action.actionType === 'submit_proposal' && <FileText className="h-4 w-4 text-blue-600" />}
                          {action.actionType === 'answer_questions' && <HelpCircle className="h-4 w-4 text-purple-600" />}
                          {action.actionType === 'upload_documents' && <Upload className="h-4 w-4 text-green-600" />}
                          {action.actionType === 'respond_to_revision' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                          <span className="font-medium text-gray-900">{action.rfpTitle}</span>
                        </div>
                        <p className="text-sm text-gray-600 capitalize">
                          {action.actionType.replace(/_/g, ' ')}
                        </p>
                        {action.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(action.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          action.urgencyTag === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : action.urgencyTag === 'due_soon'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {action.urgencyTag === 'overdue' && 'Overdue'}
                        {action.urgencyTag === 'due_soon' && 'Due Soon'}
                        {action.urgencyTag === 'waiting_on_you' && 'Waiting'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Section B: Upcoming Deadlines */}
        <div 
          className="bg-white rounded-lg shadow"
          data-demo="supplier-inbox-deadlines"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Deadlines
              </h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {inboxData.counts.deadlinesCount}
              </span>
            </div>
            
            {inboxData.upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inboxData.upcomingDeadlines.slice(0, 10).map((deadline, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{deadline.rfpTitle}</p>
                        <p className="text-sm text-gray-600 capitalize mb-1">
                          {deadline.deadlineType === 'qa' && 'Q&A Window Closes'}
                          {deadline.deadlineType === 'submission' && 'Submission Deadline'}
                          {deadline.deadlineType === 'demo' && 'Demo Window'}
                          {deadline.deadlineType === 'confirmation' && 'Confirmation Required'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(deadline.date).toLocaleDateString()} ({deadline.daysRemaining < 0 ? 'Overdue' : `${deadline.daysRemaining} days`})
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          deadline.urgencyLevel === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : deadline.urgencyLevel === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : deadline.urgencyLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {deadline.urgencyLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Section C: Invitations & Q&A */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Invitations & Q&A
              </h2>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                {inboxData.counts.invitationsCount}
              </span>
            </div>
            
            {inboxData.invitationsAndQA.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Inbox className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No pending invitations or questions</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inboxData.invitationsAndQA.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.link}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <p className="font-medium text-gray-900 mb-2">{item.rfpTitle}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {item.invitationStatus && item.invitationStatus !== 'ACCEPTED' && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          Invitation: {item.invitationStatus}
                        </span>
                      )}
                      {item.questionCount > 0 && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <HelpCircle className="h-4 w-4" />
                          {item.questionCount} Question{item.questionCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {item.messageCount > 0 && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <MessageSquare className="h-4 w-4" />
                          {item.messageCount} Message{item.messageCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Section D: Recent Activity From Buyer */}
        <div 
          className="bg-white rounded-lg shadow"
          data-demo="supplier-inbox-recent"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Recent Activity From Buyer
              </h2>
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                {inboxData.counts.activityCount}
              </span>
            </div>
            
            {inboxData.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inboxData.recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                        <p className="font-medium text-gray-900 mb-1">{activity.rfpTitle}</p>
                        <p className="text-sm text-gray-700">{activity.actionDescription}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

/**
 * Format timestamp to relative time
 */
function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
