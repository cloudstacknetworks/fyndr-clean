'use client';

/**
 * Step 62: Supplier Portal Enhancements
 * Tab Component: Documents
 */

import { useEffect, useState } from 'react';
import { 
  DocumentIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface Document {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  attachmentType: string;
  description: string | null;
  uploadedAt: string;
  uploadedBy: string;
}

interface SupplierRFPDocumentsTabProps {
  rfpId: string;
}

export default function SupplierRFPDocumentsTab({ rfpId }: SupplierRFPDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [canUpload, setCanUpload] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/supplier/rfps/${rfpId}/documents`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const result = await response.json();
        setDocuments(result.data || []);
        setCanUpload(result.meta?.canUpload || false);
        setUploadMessage(result.meta?.uploadAllowedMessage || '');
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [rfpId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    // Simple file type icon mapping
    return <DocumentIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />;
  };

  const getAttachmentTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      'GENERAL': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'PRICING_SHEET': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'REQUIREMENTS_MATRIX': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'PRESENTATION': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'DEMO_RECORDING': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'CONTRACT_DRAFT': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'OTHER': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    
    const label = type.replace(/_/g, ' ');
    const color = colorMap[type] || colorMap['OTHER'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload status */}
      <div className={`rounded-lg p-4 ${
        canUpload
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
      }`}>
        <div className="flex items-center gap-3">
          {canUpload ? (
            <DocumentIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <LockClosedIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          )}
          <div>
            <div className={`font-medium ${
              canUpload
                ? 'text-green-900 dark:text-green-100'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {canUpload ? 'Upload Window Open' : 'Upload Window Closed'}
            </div>
            <div className={`text-sm ${
              canUpload
                ? 'text-green-700 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {uploadMessage}
            </div>
          </div>
        </div>
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg">No documents uploaded yet.</p>
          {canUpload && (
            <p className="text-sm mt-2">
              Use the main submission form to upload documents.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Uploaded Documents ({documents.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                          {doc.fileName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getAttachmentTypeBadge(doc.attachmentType)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>

                      <button
                        className="flex-shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {doc.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                      </div>
                      <span>•</span>
                      <span>{doc.uploadedBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> To upload new documents or remove existing ones, please use the main submission form. This view is for reference only.
        </p>
      </div>
    </div>
  );
}
