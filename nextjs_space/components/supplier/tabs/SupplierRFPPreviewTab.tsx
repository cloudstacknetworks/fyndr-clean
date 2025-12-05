'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Tab Component: Submission Preview
 */

import { useEffect, useState } from 'react';
import { 
  DocumentTextIcon,
  DocumentIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface PreviewSection {
  category: string;
  requirements: {
    questionText: string;
    supplierAnswer: string;
    linkedDocuments: {
      fileName: string;
      fileType: string;
    }[];
  }[];
}

interface PreviewData {
  rfpTitle: string;
  buyerCompanyName: string;
  supplierName: string;
  supplierOrganization: string;
  submittedAt: string | null;
  status: string;
  sections: PreviewSection[];
  allDocuments: {
    fileName: string;
    fileType: string;
    attachmentType: string;
  }[];
  notesFromSupplier: string | null;
}

interface SupplierRFPPreviewTabProps {
  rfpId: string;
}

export default function SupplierRFPPreviewTab({ rfpId }: SupplierRFPPreviewTabProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/supplier/rfps/${rfpId}/preview`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch preview');
        }

        const result = await response.json();
        setPreview(result.data);
      } catch (err) {
        console.error('Error fetching preview:', err);
        setError('Failed to load submission preview');
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, [rfpId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not submitted';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error || 'Failed to load preview'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {preview.rfpTitle}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Buyer:</strong> {preview.buyerCompanyName}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                preview.status === 'SUBMITTED'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}
            >
              {preview.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Supplier:</strong>
            </p>
            <p className="text-gray-900 dark:text-white">
              {preview.supplierName}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {preview.supplierOrganization}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {preview.status === 'SUBMITTED' ? 'Submitted on:' : 'Last updated:'}
              </p>
              <p className="text-gray-900 dark:text-white">
                {formatDate(preview.submittedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>This is how your submission will appear to the buyer.</strong> No internal scores, comments, or other suppliers&apos; information are included in this view.
        </p>
      </div>

      {/* Sections with Q&A */}
      {preview.sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No content available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {preview.sections.map((section, sectionIdx) => (
            <div
              key={sectionIdx}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Section header */}
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {section.category}
                </h3>
              </div>

              {/* Requirements & answers */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {section.requirements.map((req, reqIdx) => (
                  <div key={reqIdx} className="px-6 py-5">
                    {/* Question */}
                    <div className="mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold flex-shrink-0">
                          Q
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {req.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Answer */}
                    <div className="ml-8">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {req.supplierAnswer}
                        </p>
                      </div>

                      {/* Linked documents */}
                      {req.linkedDocuments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">
                            Attached documents:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {req.linkedDocuments.map((doc, docIdx) => (
                              <div
                                key={docIdx}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-sm"
                              >
                                <DocumentIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {doc.fileName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All documents section */}
      {preview.allDocuments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All Uploaded Documents ({preview.allDocuments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {preview.allDocuments.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <DocumentIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {doc.attachmentType.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional notes */}
      {preview.notesFromSupplier && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Additional Notes
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {preview.notesFromSupplier}
          </p>
        </div>
      )}
    </div>
  );
}
