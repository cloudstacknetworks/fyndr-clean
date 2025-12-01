"use client";

import Link from "next/link";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface ReadinessWidgetProps {
  rfpId: string;
  supplierContactId: string;
  readinessScore: number | null;
  missingRequirementsCount?: number;
  complianceFlagsCount?: number;
  supplierName?: string;
}

export default function ReadinessWidget({
  rfpId,
  supplierContactId,
  readinessScore,
  missingRequirementsCount = 0,
  complianceFlagsCount = 0,
  supplierName
}: ReadinessWidgetProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
    if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Ready";
    if (score >= 60) return "Conditional";
    return "Not Ready";
  };

  if (readinessScore === null) {
    return (
      <Link
        href={`/dashboard/rfps/${rfpId}/responses/${supplierContactId}/readiness`}
        className="block p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Readiness Analysis</span>
          </div>
          <span className="text-xs text-gray-500">Not Calculated</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/dashboard/rfps/${rfpId}/responses/${supplierContactId}/readiness`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
      data-demo-element="readiness-widget"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-gray-900">Readiness Analysis</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreColor(readinessScore)}`}>
          {readinessScore}%
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${readinessScore >= 80 ? 'text-green-600' : readinessScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
          {getScoreLabel(readinessScore)}
        </span>
        
        <div className="flex items-center gap-3">
          {missingRequirementsCount > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <AlertTriangle className="w-3 h-3" />
              {missingRequirementsCount} Missing
            </span>
          )}
          {complianceFlagsCount > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <CheckCircle className="w-3 h-3" />
              {complianceFlagsCount} Flags
            </span>
          )}
        </div>
      </div>

      {supplierName && (
        <div className="mt-2 text-xs text-gray-500">
          {supplierName}
        </div>
      )}
    </Link>
  );
}
