/**
 * STEP 43: Supplier Outcome Dashboard - UI Page
 * 
 * /dashboard/rfps/[id]/supplier-outcomes
 * Comprehensive post-award analytics dashboard for buyers
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  TrophyIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// ==============================================================================
// TypeScript Interfaces
// ==============================================================================

interface SupplierOutcomeDetail {
  supplierId: string;
  supplierName: string;
  contactName: string | null;
  contactEmail: string | null;
  awardOutcome:
    | "recommended"
    | "awarded"
    | "shortlisted"
    | "not_selected"
    | "declined"
    | "cancelled"
    | "unknown";
  overallScore: number | null;
  weightedScore: number | null;
  mustHaveCompliance: number | null;
  strengths: string[];
  weaknesses: string[];
}

interface SupplierOutcomeDashboard {
  rfpId: string;
  rfpTitle: string;
  generatedAt: string;
  suppliers: SupplierOutcomeDetail[];
  highLevel: {
    totalSuppliers: number;
    totalShortlisted: number;
    totalDeclined: number;
    totalAwarded: number;
    winnerName: string | null;
    averageScore: number | null;
  };
}

// ==============================================================================
// Main Component
// ==============================================================================

export default function SupplierOutcomeDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const rfpId = params.id as string;

  const [dashboard, setDashboard] = useState<SupplierOutcomeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Load dashboard data
  useEffect(() => {
    if (!rfpId) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/rfps/${rfpId}/supplier-outcomes`);

        if (!res.ok) {
          if (res.status === 403) {
            toast.error("Access Denied: Buyer-only feature");
            router.push(`/dashboard/rfps/${rfpId}`);
            return;
          }
          throw new Error("Failed to load supplier outcomes");
        }

        const data = await res.json();
        setDashboard(data);
      } catch (error) {
        console.error("Error loading supplier outcomes:", error);
        toast.error("Failed to load supplier outcomes");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [rfpId, router]);

  // Export PDF handler
  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/supplier-outcomes/pdf`);

      if (!res.ok) {
        throw new Error("Failed to export PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Supplier_Outcomes_${dashboard?.rfpTitle || "Report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Supplier Outcomes PDF downloaded");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  // Download individual debrief handler
  const handleDownloadDebrief = async (supplierId: string, supplierName: string) => {
    try {
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/debrief/${supplierId}/pdf`);

      if (!res.ok) {
        throw new Error("Failed to download debrief");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Debrief_${supplierName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Debrief for ${supplierName} downloaded`);
    } catch (error) {
      console.error("Error downloading debrief:", error);
      toast.error("Failed to download debrief");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!dashboard) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (dashboard.suppliers.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supplier Outcome Dashboard
          </h1>
          <p className="text-gray-600 mb-8">{dashboard.rfpTitle}</p>

          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Suppliers Yet
            </h2>
            <p className="text-gray-500">
              No suppliers have been added to this RFP yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" data-demo="supplier-outcomes-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-demo="dashboard-title">
              Supplier Outcome Dashboard
            </h1>
            <p className="text-gray-600">{dashboard.rfpTitle}</p>
          </div>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            data-demo="export-pdf-button"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </button>
        </div>

        {/* High-Level Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-demo="summary-cards">
          <SummaryCard
            icon={<UserGroupIcon className="h-6 w-6 text-blue-600" />}
            label="Total Suppliers"
            value={dashboard.highLevel.totalSuppliers.toString()}
            bgColor="bg-blue-50"
          />
          <SummaryCard
            icon={<CheckCircleIcon className="h-6 w-6 text-green-600" />}
            label="Shortlisted"
            value={dashboard.highLevel.totalShortlisted.toString()}
            bgColor="bg-green-50"
          />
          <SummaryCard
            icon={<XCircleIcon className="h-6 w-6 text-gray-600" />}
            label="Declined"
            value={dashboard.highLevel.totalDeclined.toString()}
            bgColor="bg-gray-50"
          />
          <SummaryCard
            icon={<TrophyIcon className="h-6 w-6 text-yellow-600" />}
            label="Awarded"
            value={dashboard.highLevel.totalAwarded.toString()}
            bgColor="bg-yellow-50"
          />
        </div>

        {/* Winner & Average Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Winner</h3>
            </div>
            <p className="text-2xl font-bold text-indigo-700" data-demo="winner-name">
              {dashboard.highLevel.winnerName || "TBD"}
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Average Score</h3>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {dashboard.highLevel.averageScore ?? "N/A"}
            </p>
          </div>
        </div>

        {/* Supplier Cards Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Supplier Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-demo="supplier-cards-grid">
            {dashboard.suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.supplierId}
                supplier={supplier}
                rfpId={rfpId}
                onDownloadDebrief={handleDownloadDebrief}
              />
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comparison Table
          </h2>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200" data-demo="comparison-table">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weighted Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Must-Have %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.suppliers.map((supplier) => (
                  <tr key={supplier.supplierId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.supplierName}
                      </div>
                      {supplier.contactEmail && (
                        <div className="text-xs text-gray-500">
                          {supplier.contactEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OutcomeBadge outcome={supplier.awardOutcome} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.overallScore ?? "–"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.weightedScore ?? "–"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.mustHaveCompliance !== null
                        ? `${supplier.mustHaveCompliance.toFixed(0)}%`
                        : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// Sub-Components
// ==============================================================================

function SummaryCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {
  return (
    <div className={`p-6 ${bgColor} rounded-lg border border-gray-200`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-gray-700">{label}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SupplierCard({
  supplier,
  rfpId,
  onDownloadDebrief,
}: {
  supplier: SupplierOutcomeDetail;
  rfpId: string;
  onDownloadDebrief: (supplierId: string, supplierName: string) => void;
}) {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow" data-demo="supplier-card">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {supplier.supplierName}
        </h3>
        {supplier.contactName && (
          <p className="text-sm text-gray-600">{supplier.contactName}</p>
        )}
        {supplier.contactEmail && (
          <p className="text-xs text-gray-500">{supplier.contactEmail}</p>
        )}
      </div>

      {/* Outcome Badge */}
      <div className="mb-4">
        <OutcomeBadge outcome={supplier.awardOutcome} />
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500 mb-1">Overall</div>
          <div className="text-lg font-bold text-gray-900">
            {supplier.overallScore ?? "–"}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500 mb-1">Weighted</div>
          <div className="text-lg font-bold text-gray-900">
            {supplier.weightedScore ?? "–"}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500 mb-1">Must-Have</div>
          <div className="text-lg font-bold text-gray-900">
            {supplier.mustHaveCompliance !== null
              ? `${supplier.mustHaveCompliance.toFixed(0)}%`
              : "–"}
          </div>
        </div>
      </div>

      {/* Strengths */}
      {supplier.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Strengths</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {supplier.strengths.slice(0, 3).map((strength, index) => (
              <li key={index} className="flex items-start gap-1">
                <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {supplier.weaknesses.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Weaknesses</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {supplier.weaknesses.slice(0, 3).map((weakness, index) => (
              <li key={index} className="flex items-start gap-1">
                <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Download Debrief Button */}
      <button
        onClick={() => onDownloadDebrief(supplier.supplierId, supplier.supplierName)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        data-demo="download-debrief-button"
      >
        <DocumentArrowDownIcon className="h-4 w-4" />
        Download Debrief
      </button>
    </div>
  );
}

function OutcomeBadge({
  outcome,
}: {
  outcome:
    | "recommended"
    | "awarded"
    | "shortlisted"
    | "not_selected"
    | "declined"
    | "cancelled"
    | "unknown";
}) {
  const styles = {
    awarded: "bg-green-100 text-green-800 border-green-200",
    recommended: "bg-green-100 text-green-800 border-green-200",
    shortlisted: "bg-yellow-100 text-yellow-800 border-yellow-200",
    not_selected: "bg-red-100 text-red-800 border-red-200",
    declined: "bg-gray-100 text-gray-800 border-gray-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    unknown: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const labels = {
    awarded: "Awarded",
    recommended: "Recommended",
    shortlisted: "Shortlisted",
    not_selected: "Not Selected",
    declined: "Declined",
    cancelled: "Cancelled",
    unknown: "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[outcome]}`}
    >
      {labels[outcome]}
    </span>
  );
}
