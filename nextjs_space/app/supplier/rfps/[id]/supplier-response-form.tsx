'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Presentation,
  Video,
  File,
  Eye
} from 'lucide-react';
import { FilePreviewModal } from '@/app/components/file-preview-modal';

interface SupplierResponseFormProps {
  rfpId: string;
  initialResponse: any;
  initialAttachments: any[];
}

interface StructuredAnswers {
  executiveSummary: string;
  solutionOverview: string;
  technicalApproach: string;
  pricingOverview: string;
  implementationTimeline: string;
  keyDifferentiators: string;
  assumptions: string;
  risks: string;
  demoLink: string;
}

export default function SupplierResponseForm({
  rfpId,
  initialResponse,
  initialAttachments,
}: SupplierResponseFormProps) {
  const router = useRouter();
  const [response, setResponse] = useState(initialResponse);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);

  const isSubmitted = response?.status === 'SUBMITTED';
  const isReadOnly = isSubmitted;

  // Structured answers state
  const [structuredAnswers, setStructuredAnswers] = useState<StructuredAnswers>({
    executiveSummary: '',
    solutionOverview: '',
    technicalApproach: '',
    pricingOverview: '',
    implementationTimeline: '',
    keyDifferentiators: '',
    assumptions: '',
    risks: '',
    demoLink: '',
  });

  const [notesFromSupplier, setNotesFromSupplier] = useState('');

  // Initialize form data from response
  useEffect(() => {
    if (response) {
      const answers = response.structuredAnswers || {};
      setStructuredAnswers({
        executiveSummary: answers.executiveSummary || '',
        solutionOverview: answers.solutionOverview || '',
        technicalApproach: answers.technicalApproach || '',
        pricingOverview: answers.pricingOverview || '',
        implementationTimeline: answers.implementationTimeline || '',
        keyDifferentiators: answers.keyDifferentiators || '',
        assumptions: answers.assumptions || '',
        risks: answers.risks || '',
        demoLink: answers.demoLink || '',
      });
      setNotesFromSupplier(response.notesFromSupplier || '');
    }
  }, [response]);

  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/supplier/rfps/${rfpId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredAnswers,
          notesFromSupplier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save draft');
      }

      setResponse(data.response);
      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First save current data
      await fetch(`/api/supplier/rfps/${rfpId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredAnswers,
          notesFromSupplier,
        }),
      });

      // Then submit
      const res = await fetch(`/api/supplier/rfps/${rfpId}/response/submit`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit response');
      }

      setResponse(data.response);
      setShowSubmitModal(false);
      router.refresh();
      setSuccess('Response submitted successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Determine attachment type based on file extension
      let attachmentType = 'GENERAL';
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        attachmentType = 'PRICING_SHEET';
      } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
        attachmentType = 'PRESENTATION';
      } else if (fileName.endsWith('.mp4') || fileName.endsWith('.webm')) {
        attachmentType = 'DEMO_RECORDING';
      }
      
      formData.append('attachmentType', attachmentType);

      const res = await fetch(`/api/supplier/rfps/${rfpId}/response/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setAttachments(data.attachments);
      setResponse((prev: any) => ({ ...prev, id: data.attachment.supplierResponseId }));
      e.target.value = ''; // Reset file input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!response?.id) return;

    try {
      const res = await fetch(
        `/api/supplier/responses/${response.id}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete attachment');
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAttachmentIcon = (attachmentType: string) => {
    switch (attachmentType) {
      case 'PRICING_SHEET':
      case 'REQUIREMENTS_MATRIX':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'PRESENTATION':
        return <Presentation className="w-5 h-5 text-orange-600" />;
      case 'DEMO_RECORDING':
        return <Video className="w-5 h-5 text-purple-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAttachmentTypeLabel = (attachmentType: string) => {
    const labels: Record<string, string> = {
      GENERAL: 'General',
      PRICING_SHEET: 'Pricing Sheet',
      REQUIREMENTS_MATRIX: 'Requirements Matrix',
      PRESENTATION: 'Presentation',
      DEMO_RECORDING: 'Demo Recording',
      CONTRACT_DRAFT: 'Contract Draft',
      OTHER: 'Other',
    };
    return labels[attachmentType] || attachmentType;
  };

  return (
    <div className="space-y-6">
      {/* Response Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Response to this RFP</h2>
          {isSubmitted ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
              <CheckCircle className="w-4 h-4 mr-1" />
              Submitted on {new Date(response.submittedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
              Draft – not submitted
            </span>
          )}
        </div>
        
        {isSubmitted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Your response has been submitted. If changes are needed, please contact the buyer directly.
            </p>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Structured Response Fields */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Structured Response <span className="text-sm font-normal text-gray-500">(for comparison and scoring)</span>
        </h3>
        
        <div className="space-y-6">
          {/* Executive Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Executive Summary
            </label>
            <textarea
              value={structuredAnswers.executiveSummary}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, executiveSummary: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Provide a brief executive summary of your proposed solution..."
            />
          </div>

          {/* Solution Overview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solution Overview
            </label>
            <textarea
              value={structuredAnswers.solutionOverview}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, solutionOverview: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Describe your proposed solution..."
            />
          </div>

          {/* Technical Approach */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Approach
            </label>
            <textarea
              value={structuredAnswers.technicalApproach}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, technicalApproach: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Outline your technical approach..."
            />
          </div>

          {/* Pricing Overview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Overview
            </label>
            <textarea
              value={structuredAnswers.pricingOverview}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, pricingOverview: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Provide a high-level pricing overview (detailed pricing in attachments)..."
            />
          </div>

          {/* Implementation Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Implementation Timeline Summary
            </label>
            <textarea
              value={structuredAnswers.implementationTimeline}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, implementationTimeline: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Summarize your proposed implementation timeline..."
            />
          </div>

          {/* Key Differentiators */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Differentiators
            </label>
            <textarea
              value={structuredAnswers.keyDifferentiators}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, keyDifferentiators: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="What sets your solution apart from competitors..."
            />
          </div>

          {/* Assumptions & Dependencies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assumptions & Dependencies
            </label>
            <textarea
              value={structuredAnswers.assumptions}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, assumptions: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="List any assumptions or dependencies..."
            />
          </div>

          {/* Risks & Mitigations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risks & Mitigations
            </label>
            <textarea
              value={structuredAnswers.risks}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, risks: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="Identify potential risks and your mitigation strategies..."
            />
          </div>

          {/* Demo/Presentation Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demo / Presentation Link (Optional)
            </label>
            <input
              type="url"
              value={structuredAnswers.demoLink}
              onChange={(e) => setStructuredAnswers({ ...structuredAnswers, demoLink: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              placeholder="https://zoom.us/rec/... or https://youtube.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste a link to your demo recording or presentation (Zoom, Teams, YouTube, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attachments <span className="text-sm font-normal text-gray-500">(Excel, Presentations, Recordings, etc.)</span>
        </h3>

        {/* Upload Area */}
        {!isReadOnly && (
          <div className="mb-6">
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition">
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {uploading ? 'Uploading...' : 'Click to upload file'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, Excel, Word, PowerPoint, Video (max 50MB)
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading || isReadOnly}
                accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.pptx,.ppt,.mp4,.webm"
              />
            </label>
          </div>
        )}

        {/* Attachments List */}
        {attachments.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getAttachmentIcon(attachment.attachmentType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.fileName}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {getAttachmentTypeLabel(attachment.attachmentType)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewAttachmentId(attachment.id)}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <a
                    href={`/api/attachments/${attachment.id}/download`}
                    download
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Download
                  </a>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No attachments uploaded yet
          </p>
        )}
      </div>

      {/* Message to Buyer */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Message to Buyer</h3>
        <textarea
          value={notesFromSupplier}
          onChange={(e) => setNotesFromSupplier(e.target.value)}
          disabled={isReadOnly}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
          placeholder="Any additional notes or messages for the buyer..."
        />
      </div>

      {/* Action Buttons */}
      {!isSubmitted && (
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Final Response
              </>
            )}
          </button>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submit Final Response?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your response? After submission you will no longer be able to edit it from this portal.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Yes, Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        attachmentId={previewAttachmentId || ""}
        isOpen={!!previewAttachmentId}
        onClose={() => setPreviewAttachmentId(null)}
      />
    </div>
  );
}
