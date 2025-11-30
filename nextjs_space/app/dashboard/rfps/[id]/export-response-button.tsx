/**
 * Client Component: Export Supplier Response Button (STEP 25)
 * Allows exporting individual supplier responses in CSV, Excel, or PDF
 */

'use client';

import { useState } from 'react';
import { Download, FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportResponseButtonProps {
  rfpId: string;
  supplierContactId: string;
}

export default function ExportResponseButton({ rfpId, supplierContactId }: ExportResponseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/dashboard/rfps/${rfpId}/responses/${supplierContactId}/export?format=${format}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Trigger file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const extension = format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf';
      a.download = `response-${supplierContactId}-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setIsOpen(false);
    } catch (err) {
      setError('Failed to export response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export Response
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
          <button
            onClick={() => handleExport('csv')}
            disabled={loading}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={loading}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={loading}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 last:rounded-b-lg border-t border-gray-100 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      )}

      {error && (
        <div className="absolute right-0 mt-2 w-44 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
