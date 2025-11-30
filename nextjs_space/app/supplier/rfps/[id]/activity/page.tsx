/**
 * STEP 24: Supplier Activity Log Page (Supplier View)
 * /supplier/rfps/[id]/activity
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Clock } from "lucide-react";
import { getEventTypeColor, EVENT_TYPE_LABELS, type ActivityEventType } from "@/lib/activity-types";

interface ActivityLog {
  id: string;
  eventType: string;
  actorRole: string;
  summary: string;
  createdAt: string;
}

export default function SupplierActivityPage() {
  const params = useParams();
  const rfpId = params.id as string;

  const [items, setItems] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/supplier/rfps/${rfpId}/activity`);
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        }
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [rfpId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/supplier/rfps/${rfpId}`}>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Back to RFP
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
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
              No activity history found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((log) => {
                const colors = getEventTypeColor(log.eventType as ActivityEventType);
                
                return (
                  <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                            {EVENT_TYPE_LABELS[log.eventType as ActivityEventType] || log.eventType}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{log.summary}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This shows your activity history for this RFP. Some system events and buyer-only actions are not displayed.
          </p>
        </div>
      </div>
    </div>
  );
}
