'use client';

/**
 * STEP 63: RFP Selector Modal Component
 * Allows selection of RFP (and optionally supplier/summary) for exports
 */

import { useState, useEffect } from 'react';
import { ExportDefinition } from '@/lib/exports/export-registry';

interface RfpSelectorModalProps {
  exportDef: ExportDefinition;
  onSelect: (params: { rfpId?: string; supplierId?: string; summaryId?: string }) => void;
  onClose: () => void;
}

interface RFP {
  id: string;
  title: string;
  stage: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
}

export default function RfpSelectorModal({ exportDef, onSelect, onClose }: RfpSelectorModalProps) {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRfpId, setSelectedRfpId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [step, setStep] = useState<'rfp' | 'supplier'>('rfp');
  
  // Fetch RFPs on mount
  useEffect(() => {
    fetchRfps();
  }, []);
  
  // Fetch suppliers when RFP is selected and supplier is required
  useEffect(() => {
    if (selectedRfpId && exportDef.requiresSupplierId) {
      fetchSuppliers(selectedRfpId);
      setStep('supplier');
    } else if (selectedRfpId && !exportDef.requiresSupplierId) {
      // If supplier not required, submit immediately
      handleSubmit();
    }
  }, [selectedRfpId]);
  
  const fetchRfps = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/rfps');
      const data = await response.json();
      setRfps(data.rfps || []);
    } catch (error) {
      console.error('Failed to fetch RFPs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSuppliers = async (rfpId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/suppliers`);
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = () => {
    const params: { rfpId?: string; supplierId?: string; summaryId?: string } = {};
    
    if (selectedRfpId) {
      params.rfpId = selectedRfpId;
    }
    
    if (selectedSupplierId) {
      params.supplierId = selectedSupplierId;
    }
    
    onSelect(params);
  };
  
  const filteredRfps = rfps.filter(rfp =>
    rfp.title.toLowerCase().includes(search.toLowerCase()) ||
    rfp.stage.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    supplier.email.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 'rfp' ? 'Select RFP' : 'Select Supplier'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {exportDef.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder={step === 'rfp' ? 'Search RFPs...' : 'Search suppliers...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : step === 'rfp' ? (
            // RFP Selection
            <>
              {filteredRfps.length === 0 ? (
                <p className="text-gray-600 text-center py-12">No RFPs found</p>
              ) : (
                <div className="space-y-2">
                  {filteredRfps.map(rfp => (
                    <button
                      key={rfp.id}
                      onClick={() => setSelectedRfpId(rfp.id)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900">{rfp.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          {rfp.stage}
                        </span>
                        <span>
                          {new Date(rfp.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Supplier Selection
            <>
              {filteredSuppliers.length === 0 ? (
                <p className="text-gray-600 text-center py-12">No suppliers found</p>
              ) : (
                <div className="space-y-2">
                  {filteredSuppliers.map(supplier => (
                    <button
                      key={supplier.id}
                      onClick={() => {
                        setSelectedSupplierId(supplier.id);
                        handleSubmit();
                      }}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{supplier.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
          {step === 'supplier' && (
            <button
              onClick={() => {
                setStep('rfp');
                setSelectedRfpId(null);
                setSelectedSupplierId(null);
              }}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
