/**
 * STEP 24: Per-RFP Activity Log Page (Buyer View)
 * /dashboard/rfps/[id]/activity
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ChevronDown, ChevronUp, Loader2, Filter, Calendar } from "lucide-react";
import { getEventTypeColor, EVENT_TYPE_LABELS, type ActivityEventType } from "@/lib/activity-types";

interface ActivityLog {
  id: string;
  eventType: string;
  actorRole: string;
  summary: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

export default function RFPActivityPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params.id as string;

  const [items, setItems] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filters
  const [eventType, setEventType] = useState("");
  const [actorRole, setActorRole] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (eventType) params.append("eventType", eventType);
      if (actorRole) params.append("actorRole", actorRole);
      if (dateFrom) params.append("dateFrom", new Date(dateFrom).toISOString());
      if (dateTo) params.append("dateTo", new Date(dateTo).toISOString());

      const response = await fetch(`/api/dashboard/rfps/${rfpId}/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, eventType, actorRole, dateFrom, dateTo]);

  const handleExportCSV = () => {
    window.open(`/api/dashboard/rfps/${rfpId}/activity/export`, "_blank");
  };

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/rfps/${rfpId}`}>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                Back to RFP
              </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Activity Timeline</h1>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Events</option>
                {Object.keys(EVENT_TYPE_LABELS).map((type) => (
                  <option key={type} value={type}>{EVENT_TYPE_LABELS[type as ActivityEventType]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actor Role</label>
              <select
                value={actorRole}
                onChange={(e) => { setActorRole(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                <option value="BUYER">Buyer</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activity logs found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((log) => {
                const isExpanded = expandedIds.has(log.id);
                const colors = getEventTypeColor(log.eventType as ActivityEventType);
                
                return (
                  <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                            {EVENT_TYPE_LABELS[log.eventType as ActivityEventType] || log.eventType}
                          </span>
                          <span className="text-sm text-gray-500">{log.actorRole}</span>
                          <span className="text-sm text-gray-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium mb-1">{log.summary}</p>
                        {log.user && (
                          <p className="text-sm text-gray-600">
                            by {log.user.name || log.user.email}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpanded(log.id)}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Details:</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-500 mt-2">IP: {log.ipAddress}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
