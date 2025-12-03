"use client";

/**
 * STEP 41: Award Recommendation & Finalization Workspace (Buyer-Only)
 * 
 * This page allows buyers to:
 * - Select the recommended or awarded supplier
 * - View scoring summaries
 * - Record decision rationale
 * - Preview and commit award decisions
 * - Export award decision PDFs
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface SupplierResponse {
  id: string;
  supplierContactId: string;
  supplierContact: {
    id: string;
    name: string;
    organization: string | null;
  };
  finalScore: number | null;
  readinessScore: number | null;
  awardOutcomeStatus: string | null;
}

interface AwardSnapshot {
  rfpId: string;
  decidedAt: string;
  decidedByUserId: string;
  status: string;
  recommendedSupplierId: string | null;
  recommendedSupplierName: string | null;
  decisionBriefSummary: {
    keyDrivers: string[];
    keyRisks: string[];
    mustHaveCompliance: boolean | null;
  };
  scoringMatrixSummary: {
    topSuppliers: Array<{
      id: string;
      name: string;
      overallScore: number | null;
      weightedScore: number | null;
      mustHaveCompliance: boolean | null;
    }>;
  };
  timelineSummary: {
    createdAt: string;
    targetAwardDate: string | null;
    actualAwardDate: string;
    elapsedDays: number;
  };
  portfolioSummary: {
    totalRfps: number | null;
    averageScore: number | null;
    companyName: string | null;
  };
  buyerNotes: string;
}

interface RFPData {
  id: string;
  title: string;
  status: string;
  awardStatus: string | null;
  awardedSupplierId: string | null;
  awardNotes: string | null;
  awardSnapshot: AwardSnapshot | null;
  supplierResponses: SupplierResponse[];
  scoringMatrixSnapshot: any;
}

export default function AwardFinalizationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const rfpId = params.id as string;

  const [rfpData, setRfpData] = useState<RFPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [awardStatus, setAwardStatus] = useState<"recommended" | "awarded" | "cancelled">("recommended");
  const [buyerNotes, setBuyerNotes] = useState("");
  const [supplierOutcomes, setSupplierOutcomes] = useState<Record<string, string>>({});

  // UI state
  const [previewSnapshot, setPreviewSnapshot] = useState<AwardSnapshot | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingDebrief, setDownloadingDebrief] = useState<string | null>(null);

  // Load RFP and award data
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    loadRfpData();
  }, [rfpId, sessionStatus]);

  const loadRfpData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load RFP data
      const rfpRes = await fetch(`/api/dashboard/rfps/${rfpId}`);
      if (!rfpRes.ok) {
        throw new Error("Failed to load RFP data");
      }
      const rfpJson = await rfpRes.json();
      const rfp = rfpJson.data;

      // Load award status
      const awardRes = await fetch(`/api/dashboard/rfps/${rfpId}/award`);
      if (awardRes.ok) {
        const awardJson = await awardRes.json();
        const awardData = awardJson.data;

        rfp.awardStatus = awardData.awardStatus;
        rfp.awardedSupplierId = awardData.awardedSupplierId;
        rfp.awardNotes = awardData.awardNotes;
        rfp.awardSnapshot = awardData.awardSnapshot;
      }

      setRfpData(rfp);

      // Initialize form with existing data if available
      if (rfp.awardedSupplierId) {
        setSelectedSupplierId(rfp.awardedSupplierId);
      }
      if (rfp.awardStatus && rfp.awardStatus !== "not_awarded") {
        setAwardStatus(rfp.awardStatus as "recommended" | "awarded" | "cancelled");
      }
      if (rfp.awardNotes) {
        setBuyerNotes(rfp.awardNotes);
      }

      // Initialize supplier outcomes
      if (rfp.supplierResponses) {
        const outcomes: Record<string, string> = {};
        rfp.supplierResponses.forEach((response: SupplierResponse) => {
          if (response.awardOutcomeStatus) {
            outcomes[response.id] = response.awardOutcomeStatus;
          }
        });
        setSupplierOutcomes(outcomes);
      }

    } catch (err: any) {
      console.error("Error loading RFP data:", err);
      setError(err.message || "Failed to load RFP data");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/award/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedSupplierId: awardStatus === "cancelled" ? null : selectedSupplierId,
          status: awardStatus,
          buyerNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate preview");
      }

      const data = await res.json();
      setPreviewSnapshot(data.data.preview);
      setShowPreview(true);
    } catch (err: any) {
      console.error("Error generating preview:", err);
      setError(err.message);
    }
  };

  const handleCommit = async () => {
    if (awardStatus !== "cancelled" && !selectedSupplierId) {
      setError("Please select a supplier or choose 'Cancelled' status");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/dashboard/rfps/${rfpId}/award/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedSupplierId: awardStatus === "cancelled" ? null : selectedSupplierId,
          status: awardStatus,
          buyerNotes,
          supplierOutcomeMap: supplierOutcomes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to commit award decision");
      }

      const data = await res.json();
      
      // Reload data
      await loadRfpData();
      
      // Show success message
      alert(`Award decision committed: ${awardStatus}`);
      
      // Optionally redirect to RFP detail page
      // router.push(`/dashboard/rfps/${rfpId}`);
    } catch (err: any) {
      console.error("Error committing award:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      setError(null);

      const res = await fetch(`/api/dashboard/rfps/${rfpId}/award/pdf`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to export PDF");
      }

      // Download the PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `award-decision-${rfpId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error exporting PDF:", err);
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setExporting(true);
      setError(null);

      const res = await fetch(`/api/dashboard/rfps/${rfpId}/award/docx`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to export Word document");
      }

      // Download the DOCX
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `award-decision-${rfpId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error exporting Word document:", err);
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadDebrief = async (supplierId: string, supplierName: string) => {
    try {
      setDownloadingDebrief(supplierId);
      setError(null);

      const res = await fetch(`/api/dashboard/rfps/${rfpId}/supplier-debrief/${supplierId}/pdf`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to download debrief pack");
      }

      // Download the PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Supplier_Debrief_${supplierName.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error downloading debrief pack:", err);
      setError(err.message);
    } finally {
      setDownloadingDebrief(null);
    }
  };

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "awarded":
        return "bg-green-100 text-green-800";
      case "recommended":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score === null) return "bg-gray-100 text-gray-600";
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading award workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !rfpData) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error Loading Data</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!rfpData) return null;

  // Check if there are supplier responses
  const hasResponses = rfpData.supplierResponses && rfpData.supplierResponses.length > 0;

  // Get top 3 suppliers from scoring matrix
  const topSuppliers = rfpData.scoringMatrixSnapshot?.suppliers?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50" data-demo="award-workspace">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm" data-demo="award-header">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Award Recommendation & Finalization
              </h1>
              <p className="text-gray-600 mb-3">
                Select the recommended supplier and finalize this RFP.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(rfpData.awardStatus)}`}>
                  {rfpData.awardStatus || "Not Awarded"}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={!hasResponses}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                data-demo="award-preview-button"
              >
                Preview Award Summary
              </button>
              <button
                onClick={handleCommit}
                disabled={submitting || !hasResponses}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                data-demo="award-commit-button"
              >
                {submitting ? "Committing..." : "Commit Award Decision"}
              </button>
              <button
                onClick={handleExportPdf}
                disabled={exporting || !rfpData.awardSnapshot}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                data-demo="award-export-pdf"
              >
                {exporting ? "Exporting..." : "Export Award PDF"}
              </button>
              <button
                onClick={handleExportDocx}
                disabled={exporting || !rfpData.awardSnapshot}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                data-demo="award-export-docx"
              >
                {exporting ? "Exporting..." : "Download Word (.docx)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasResponses && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Supplier Responses Yet</h3>
            <p className="text-gray-600 mb-4">
              This RFP has no supplier responses. You cannot make an award decision until suppliers have submitted their proposals.
            </p>
            <button
              onClick={() => router.push(`/dashboard/rfps/${rfpId}`)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to RFP Details
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasResponses && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Decision Controls */}
            <div className="space-y-6">
              {/* Supplier Selector */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Select Supplier</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommended or Awarded Supplier
                    </label>
                    <select
                      value={selectedSupplierId || ""}
                      onChange={(e) => setSelectedSupplierId(e.target.value || null)}
                      disabled={awardStatus === "cancelled"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      data-demo="award-supplier-selector"
                    >
                      <option value="">-- Select Supplier --</option>
                      {rfpData.supplierResponses.map((response) => (
                        <option key={response.id} value={response.supplierContactId}>
                          {response.supplierContact.organization || response.supplierContact.name}
                          {response.finalScore ? ` (Score: ${response.finalScore.toFixed(1)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Award Status
                    </label>
                    <select
                      value={awardStatus}
                      onChange={(e) => setAwardStatus(e.target.value as "recommended" | "awarded" | "cancelled")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-demo="award-status-selector"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="awarded">Awarded</option>
                      <option value="cancelled">Cancelled (No Award)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scoring Summary */}
              {topSuppliers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Top Suppliers - Scoring Summary</h2>
                  <div className="space-y-3">
                    {topSuppliers.map((supplier: any) => (
                      <div
                        key={supplier.id}
                        className={`p-4 rounded-lg border-2 ${
                          selectedSupplierId === supplier.id
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{supplier.name}</span>
                          {selectedSupplierId === supplier.id && (
                            <span className="text-purple-600 font-bold">✓ Selected</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Overall:</span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getScoreBadgeClass(supplier.overallScore)}`}>
                              {supplier.overallScore?.toFixed(1) || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Weighted:</span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getScoreBadgeClass(supplier.weightedScore)}`}>
                              {supplier.weightedScore?.toFixed(1) || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Compliant:</span>
                            <span className={`ml-2 font-semibold ${supplier.mustHaveCompliance ? "text-green-600" : "text-red-600"}`}>
                              {supplier.mustHaveCompliance ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplier Outcome Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Supplier Outcomes & Debriefs</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Tag each supplier with their outcome status and download debrief packs.
                </p>
                <div className="space-y-3">
                  {rfpData.supplierResponses.map((response) => (
                    <div key={response.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {response.supplierContact.organization || response.supplierContact.name}
                        </span>
                        <select
                          value={supplierOutcomes[response.id] || ""}
                          onChange={(e) => setSupplierOutcomes({
                            ...supplierOutcomes,
                            [response.id]: e.target.value,
                          })}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">-- Not Set --</option>
                          <option value="recommended">Recommended</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="not_selected">Not Selected</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleDownloadDebrief(
                          response.supplierContactId,
                          response.supplierContact.organization || response.supplierContact.name
                        )}
                        disabled={downloadingDebrief === response.supplierContactId || !rfpData.scoringMatrixSnapshot}
                        className="w-full inline-flex items-center justify-center px-3 py-1.5 border border-purple-600 rounded text-xs font-medium text-purple-600 bg-white hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-demo="supplier-debrief-export"
                        title={!rfpData.scoringMatrixSnapshot ? "Scoring matrix not available" : "Download supplier debrief pack"}
                      >
                        {downloadingDebrief === response.supplierContactId ? (
                          <>
                            <svg className="animate-spin h-3 w-3 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Debrief Pack
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel: Notes and Snapshot */}
            <div className="space-y-6">
              {/* Buyer Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Decision Rationale & Notes</h2>
                <textarea
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  placeholder="Enter your decision rationale, key considerations, and any additional notes..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-demo="award-buyer-notes"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">Pre-Award Only</h3>
                    <p className="text-sm text-blue-800">
                      FYNDR records your award decision and creates a frozen snapshot of the selection process.
                      This is a pre-award tool only. FYNDR does not handle post-award procurement activities
                      such as contracts, purchase orders, or supplier onboarding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Snapshot Preview */}
              {(showPreview || rfpData.awardSnapshot) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Award Decision Snapshot</h2>
                  {(() => {
                    const snapshot = previewSnapshot || rfpData.awardSnapshot;
                    if (!snapshot) return null;

                    return (
                      <div className="space-y-4">
                        {/* Status */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(snapshot.status)}`}>
                            {snapshot.status.toUpperCase()}
                          </div>
                        </div>

                        {/* Selected Supplier */}
                        {snapshot.recommendedSupplierName && snapshot.status !== "cancelled" && (
                          <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                            <div className="text-sm font-medium text-yellow-800 mb-1">
                              {snapshot.status === "awarded" ? "🏆 Awarded Supplier" : "⭐ Recommended Supplier"}
                            </div>
                            <div className="text-lg font-bold text-yellow-900">
                              {snapshot.recommendedSupplierName}
                            </div>
                          </div>
                        )}

                        {/* Key Drivers */}
                        {snapshot.decisionBriefSummary.keyDrivers.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-700 mb-2">Key Decision Drivers</div>
                            <ul className="space-y-1">
                              {snapshot.decisionBriefSummary.keyDrivers.slice(0, 3).map((driver, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-green-600">✓</span>
                                  <span>{driver}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Key Risks */}
                        {snapshot.decisionBriefSummary.keyRisks.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-700 mb-2">Key Risks</div>
                            <ul className="space-y-1">
                              {snapshot.decisionBriefSummary.keyRisks.slice(0, 3).map((risk, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-yellow-600">⚠</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-2">Timeline</div>
                          <div className="text-sm text-gray-700">
                            <strong>{snapshot.timelineSummary.elapsedDays}</strong> days from creation to award
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
