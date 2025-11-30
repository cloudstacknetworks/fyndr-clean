/**
 * Client Component: Export RFPs Button (STEP 25)
 * Allows exporting all RFPs in CSV or Excel format
 */

'use client';

import { useState } from 'react';
import { Download, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function ExportRFPsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/rfps/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Trigger file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rfps-export-${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsOpen(false);
    } catch (err) {
      setError('Failed to export RFPs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all shadow-sm hover:shadow-md"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
        Export RFP List
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
          <button
            onClick={() => handleExport('csv')}
            disabled={loading}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={loading}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 last:rounded-b-lg border-t border-gray-100 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as Excel
          </button>
        </div>
      )}

      {error && (
        <div className="absolute right-0 mt-2 w-48 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
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
