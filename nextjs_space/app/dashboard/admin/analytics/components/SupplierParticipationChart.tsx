"use client";

/**
 * STEP 64: Supplier Participation Funnel Chart
 * Simple funnel visualization showing invited -> submitted -> shortlisted
 */

import { Users, CheckCircle, Star } from "lucide-react";

interface SupplierParticipationData {
  avgInvited: number;
  avgSubmitted: number;
  avgShortlisted: number;
}

interface SupplierParticipationChartProps {
  data: SupplierParticipationData;
}

export default function SupplierParticipationChart({ data }: SupplierParticipationChartProps) {
  const { avgInvited, avgSubmitted, avgShortlisted } = data;

  const submissionRate = avgInvited > 0 ? Math.round((avgSubmitted / avgInvited) * 100) : 0;
  const shortlistRate = avgSubmitted > 0 ? Math.round((avgShortlisted / avgSubmitted) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Invited */}
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Avg Invited</span>
            <span className="text-lg font-bold text-gray-900">{avgInvited}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>

      {/* Submitted */}
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Avg Submitted</span>
            <span className="text-lg font-bold text-gray-900">
              {avgSubmitted}
              <span className="text-sm text-gray-500 ml-2">({submissionRate}%)</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${submissionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Shortlisted */}
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
          <Star className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Avg Shortlisted</span>
            <span className="text-lg font-bold text-gray-900">
              {avgShortlisted}
              <span className="text-sm text-gray-500 ml-2">({shortlistRate}%)</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full"
              style={{ width: `${shortlistRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
