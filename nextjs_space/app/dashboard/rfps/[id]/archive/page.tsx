/**
 * STEP 47: RFP Archive and Compliance Pack Page
 * Close & Archive RFP workflow + Compliance Pack export
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  FileCheck,
  Download,
  AlertCircle,
  CheckCircle2,
  Eye,
  Save,
  FileText,
  Lock,
  Calendar,
  User,
  Building,
  TrendingUp,
  Award,
  FileSpreadsheet,
} from "lucide-react";
import type { CompliancePackSnapshot } from "@/lib/archive/compliance-pack-service";

interface ArchiveStatus {
  isArchived: boolean;
  archivedAt: string | null;
  archivedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  compliancePackSnapshot: CompliancePackSnapshot | null;
}

export default function RFPArchivePage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus | null>(null);
  const [preview, setPreview] = useState<CompliancePackSnapshot | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCommitLoading, setIsCommitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch archive status
  useEffect(() => {
    fetchArchiveStatus();
  }, [rfpId]);

  const fetchArchiveStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/archive`);
      const data = await response.json();

      if (response.ok && data.success) {
        setArchiveStatus(data.data);
      } else {
        setError(data.error || "Failed to fetch archive status");
      }
    } catch (err: any) {
      setError("Network error while fetching archive status");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsPreviewLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/rfps/${rfpId}/archive/preview`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPreview(data.data.preview);
        setSuccessMessage("Preview generated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to generate preview");
      }
    } catch (err: any) {
      setError("Network error while generating preview");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!confirm("Are you sure you want to archive this RFP? This action cannot be undone. The RFP will become read-only.")) {
      return;
    }

    try {
      setIsCommitLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/rfps/${rfpId}/archive/commit`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("RFP archived successfully!");
        // Reload the page to reflect the new archived status
        setTimeout(() => {
          router.refresh();
          fetchArchiveStatus();
        }, 1500);
      } else {
        setError(data.error || "Failed to archive RFP");
      }
    } catch (err: any) {
      setError("Network error while archiving RFP");
    } finally {
      setIsCommitLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/archive/compliance-pack.pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compliance-pack-${rfpId}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to export PDF");
      }
    } catch (err: any) {
      setError("Network error while exporting PDF");
    }
  };

  const handleDownloadDOCX = async () => {
    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/archive/compliance-pack.docx`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compliance-pack-${rfpId}-${Date.now()}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to export Word document");
      }
    } catch (err: any) {
      setError("Network error while exporting Word document");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading archive status...</div>
        </div>
      </div>
    );
  }

  const snapshot = archiveStatus?.compliancePackSnapshot || preview;
  const isArchived = archiveStatus?.isArchived || false;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/dashboard/rfps/${rfpId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to RFP
        </Link>

        {isArchived && (
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md"
            >
              <Download className="h-5 w-5" />
              Export PDF
            </button>
            <button
              onClick={handleDownloadDOCX}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md"
            >
              <Download className="h-5 w-5" />
              Export Word
            </button>
          </div>
        )}
      </div>

      {/* Page Title */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl shadow-lg p-8 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Archive className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white">RFP Archive & Compliance Pack</h1>
        </div>
        <p className="text-slate-200">
          Close and archive this RFP with a comprehensive compliance audit bundle
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800 font-semibold">Success</p>
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Archive Status Banner */}
      {isArchived && archiveStatus && (
        <div className="mb-6 bg-slate-50 border-2 border-slate-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Lock className="h-6 w-6 text-slate-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">This RFP is Archived</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-slate-700">Archived At:</span>
                  <span className="ml-2 text-slate-600">{formatDate(archiveStatus.archivedAt)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Archived By:</span>
                  <span className="ml-2 text-slate-600">
                    {archiveStatus.archivedBy?.name || archiveStatus.archivedBy?.email || "N/A"}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 mt-2 text-sm">
                This RFP is now read-only. All data has been preserved in a compliance pack snapshot.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons (only if not archived) */}
      {!isArchived && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={handlePreview}
              disabled={isPreviewLoading}
              className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-5 w-5" />
              {isPreviewLoading ? "Generating Preview..." : "Preview Compliance Pack"}
            </button>
            <button
              onClick={handleCommit}
              disabled={isCommitLoading}
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {isCommitLoading ? "Archiving..." : "Archive RFP"}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Preview the compliance pack before archiving. Archiving makes the RFP read-only and cannot be undone.
          </p>
        </div>
      )}

      {/* Compliance Pack Preview */}
      {snapshot && (
        <div className="space-y-6">
          {/* Archive Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-blue-600" />
              Archive Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">RFP ID</span>
                </div>
                <p className="text-gray-900 font-mono text-sm">{snapshot.rfpId}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Archived At</span>
                </div>
                <p className="text-gray-900">{formatDate(snapshot.timeline.archivedAt)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Archived By</span>
                </div>
                <p className="text-gray-900">{snapshot.metadata.generatedBy.name || snapshot.metadata.generatedBy.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Company</span>
                </div>
                <p className="text-gray-900">{snapshot.company.name}</p>
              </div>
            </div>
          </div>

          {/* RFP Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">RFP Overview</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-gray-700">Title:</span>
                <p className="text-gray-900 text-lg">{snapshot.rfpTitle}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Description:</span>
                <p className="text-gray-900">{snapshot.rfpDescription || "No description provided"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Created At:</span>
                  <p className="text-gray-900">{formatDate(snapshot.timeline.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Supplier:</span>
                  <p className="text-gray-900">{snapshot.supplier.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{snapshot.timelineSummary.totalQuestions}</div>
                <div className="text-sm text-blue-600 mt-1">Total Questions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{snapshot.timelineSummary.answeredQuestions}</div>
                <div className="text-sm text-green-600 mt-1">Answered</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-700">{snapshot.timelineSummary.totalBroadcasts}</div>
                <div className="text-sm text-purple-600 mt-1">Broadcasts</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-700">{snapshot.timelineSummary.submittedResponses}</div>
                <div className="text-sm text-orange-600 mt-1">Submitted</div>
              </div>
            </div>
          </div>

          {/* Award Decision */}
          {snapshot.award.awardStatus && snapshot.award.awardStatus !== "not_awarded" && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-6 w-6 text-emerald-600" />
                Award Decision
              </h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-emerald-700">Status:</span>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800">
                    {snapshot.award.awardStatus?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Decided At:</span>
                  <p className="text-gray-900">{formatDate(snapshot.award.awardDecidedAt)}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Decided By:</span>
                  <p className="text-gray-900">
                    {snapshot.award.awardDecidedBy?.name || snapshot.award.awardDecidedBy?.email || "N/A"}
                  </p>
                </div>
              </div>
              {snapshot.award.awardNotes && (
                <div className="mt-4">
                  <span className="text-sm font-semibold text-gray-700">Notes:</span>
                  <p className="text-gray-900 mt-1">{snapshot.award.awardNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Supplier Outcomes */}
          {snapshot.supplierOutcomes.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Supplier Outcomes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Supplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invitation</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Response</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Award</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.supplierOutcomes.map((outcome, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{outcome.supplierName}</p>
                            <p className="text-sm text-gray-500">{outcome.contactEmail || "N/A"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{outcome.invitationStatus || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{outcome.responseStatus || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{outcome.awardOutcomeStatus || "N/A"}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {outcome.comparisonScore !== null ? outcome.comparisonScore.toFixed(1) : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scoring Summary (if available) */}
          {snapshot.scoring.opportunityScore && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                Scoring Summary
              </h2>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-700">Opportunity Score:</span>
                  <span className="text-3xl font-bold text-purple-700">{snapshot.scoring.opportunityScore}/100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Preview Available */}
      {!snapshot && !isArchived && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Preview Available</h3>
          <p className="text-gray-600 mb-4">Click "Preview Compliance Pack" to generate a preview before archiving.</p>
        </div>
      )}
    </div>
  );
}
