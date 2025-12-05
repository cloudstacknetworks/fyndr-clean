'use client';

/**
 * STEP 63: Export History Panel Component
 * Displays recent exports with re-download capability
 */

import { formatDistanceToNow } from 'date-fns';
import { ExportHistoryItem } from './ExportCenterClient';

interface ExportHistoryPanelProps {
  history: ExportHistoryItem[];
  onDownload: (base64Data: string, filename: string, contentType: string) => void;
}

export default function ExportHistoryPanel({ history, onDownload }: ExportHistoryPanelProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getContentType = (exportType: string) => {
    switch (exportType) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/octet-stream';
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'RFP': return 'bg-blue-100 text-blue-700';
      case 'Evaluation': return 'bg-purple-100 text-purple-700';
      case 'Scoring': return 'bg-green-100 text-green-700';
      case 'Summary': return 'bg-yellow-100 text-yellow-700';
      case 'Requirements': return 'bg-indigo-100 text-indigo-700';
      case 'Activity Log': return 'bg-gray-100 text-gray-700';
      case 'Compliance': return 'bg-red-100 text-red-700';
      case 'Automation': return 'bg-pink-100 text-pink-700';
      case 'System': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4" data-demo="export-history-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Export History</h2>
        <span className="text-sm text-gray-500">{history.length} exports</span>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <p className="mt-4 text-gray-600 text-sm">No exports yet</p>
          <p className="mt-1 text-gray-500 text-xs">
            Your recent exports will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {history.map(item => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {item.exportTitle}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded shrink-0">
                  {item.exportType.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(item.fileSize)}
                </span>
              </div>
              
              {item.rfpId && (
                <p className="text-xs text-gray-500 mb-2 truncate" title={`RFP: ${item.rfpId}`}>
                  RFP: {item.rfpId}
                </p>
              )}
              
              <button
                onClick={() => onDownload(item.data, item.filename, getContentType(item.exportType))}
                className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Again
              </button>
            </div>
          ))}
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Showing last {Math.min(history.length, 20)} exports
          </p>
        </div>
      )}
    </div>
  );
}
