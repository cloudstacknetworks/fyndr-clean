'use client';

/**
 * STEP 63: Export Center Client Component
 * Main client-side interface for the Export Center
 */

import { useState, useEffect } from 'react';
import { ExportDefinition } from '@/lib/exports/export-registry';
import ExportHistoryPanel from './ExportHistoryPanel';
import RfpSelectorModal from './RfpSelectorModal';
import { toast } from 'react-hot-toast';

interface ExportCenterClientProps {
  exports: ExportDefinition[];
}

export interface ExportHistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  exportType: string;
  exportId: string;
  exportTitle: string;
  category: string;
  fileSize: number;
  rfpId?: string;
  data: string; // base64
}

export default function ExportCenterClient({ exports }: ExportCenterClientProps) {
  const [selectedExport, setSelectedExport] = useState<ExportDefinition | null>(null);
  const [showRfpSelector, setShowRfpSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  
  // Load export history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('fyndr_export_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setExportHistory(parsed);
      } catch (e) {
        console.error('Failed to parse export history:', e);
      }
    }
  }, []);
  
  // Save export history to localStorage
  const saveExportHistory = (newItem: ExportHistoryItem) => {
    const updated = [newItem, ...exportHistory].slice(0, 20); // Keep last 20
    setExportHistory(updated);
    localStorage.setItem('fyndr_export_history', JSON.stringify(updated));
  };
  
  // Group exports by category
  const categories = [
    'RFP',
    'Evaluation',
    'Scoring',
    'Summary',
    'Requirements',
    'Activity Log',
    'Compliance',
    'Automation',
    'System'
  ];
  
  const exportsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = exports.filter(exp => exp.category === cat && exp.enabled);
    return acc;
  }, {} as Record<string, ExportDefinition[]>);
  
  // Handle export click
  const handleExportClick = (exportDef: ExportDefinition) => {
    setSelectedExport(exportDef);
    
    if (exportDef.requiresRfpId || exportDef.requiresSupplierId) {
      setShowRfpSelector(true);
    } else {
      // Execute immediately for system-level exports
      executeExport(exportDef, {});
    }
  };
  
  // Execute export
  const executeExport = async (
    exportDef: ExportDefinition,
    params: { rfpId?: string; supplierId?: string; summaryId?: string }
  ) => {
    setLoading(true);
    setShowRfpSelector(false);
    
    try {
      const response = await fetch('/api/dashboard/export/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportId: exportDef.id,
          rfpId: params.rfpId,
          supplierId: params.supplierId,
          summaryId: params.summaryId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      
      const result = await response.json();
      
      // Save to export history
      const historyItem: ExportHistoryItem = {
        id: `${Date.now()}-${Math.random()}`,
        filename: result.filename,
        timestamp: result.timestamp,
        exportType: exportDef.exportType,
        exportId: exportDef.id,
        exportTitle: exportDef.title,
        category: exportDef.category,
        fileSize: result.fileSize,
        rfpId: result.rfpId,
        data: result.data
      };
      saveExportHistory(historyItem);
      
      // Trigger download
      downloadFile(result.data, result.filename, result.contentType);
      
      toast.success(`Export generated successfully: ${result.filename}`);
      
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed');
    } finally {
      setLoading(false);
      setSelectedExport(null);
    }
  };
  
  // Download file from base64
  const downloadFile = (base64Data: string, filename: string, contentType: string) => {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Export Categories */}
      <div className="lg:col-span-2 space-y-8">
        {categories.map(category => {
          const categoryExports = exportsByCategory[category];
          if (!categoryExports || categoryExports.length === 0) return null;
          
          return (
            <div key={category} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {category} Exports
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryExports.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => handleExportClick(exp)}
                    disabled={loading}
                    data-demo="export-item-button"
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{exp.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                      </div>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded shrink-0">
                        {exp.exportType.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Empty state if no exports */}
        {categories.every(cat => !exportsByCategory[cat] || exportsByCategory[cat].length === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No exports available</p>
          </div>
        )}
      </div>
      
      {/* Export History Panel */}
      <div className="lg:col-span-1">
        <ExportHistoryPanel
          history={exportHistory}
          onDownload={downloadFile}
        />
      </div>
      
      {/* RFP Selector Modal */}
      {showRfpSelector && selectedExport && (
        <RfpSelectorModal
          exportDef={selectedExport}
          onSelect={(params) => executeExport(selectedExport, params)}
          onClose={() => {
            setShowRfpSelector(false);
            setSelectedExport(null);
          }}
        />
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Generating export...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
