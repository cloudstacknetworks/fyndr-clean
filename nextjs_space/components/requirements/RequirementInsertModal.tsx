/**
 * STEP 57: Company-Level Master Requirements Library
 * UI Component: Requirement Insert Modal
 * Used in RFP Editor to insert requirements from the library
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';

interface RequirementBlock {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: string;
  contentJson: any;
}

interface RequirementInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (requirements: RequirementBlock[]) => void;
  rfpId: string;
}

export function RequirementInsertModal({
  isOpen,
  onClose,
  onInsert,
  rfpId,
}: RequirementInsertModalProps) {
  const [requirements, setRequirements] = useState<RequirementBlock[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<RequirementBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchRequirements();
    }
  }, [isOpen]);

  useEffect(() => {
    filterRequirements();
  }, [requirements, searchTerm, categoryFilter]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requirements');
      if (!res.ok) throw new Error('Failed to fetch requirements');
      const data = await res.json();
      setRequirements(data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequirements = () => {
    let filtered = requirements;

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.description && req.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      filtered = filtered.filter((req) => req.category === categoryFilter);
    }

    setFilteredRequirements(filtered);
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleInsert = () => {
    const selectedRequirements = requirements.filter((req) =>
      selectedIds.has(req.id)
    );
    onInsert(selectedRequirements);
    setSelectedIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Insert Requirements from Library
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search requirements..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="FUNCTIONAL">Functional</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="LEGAL">Legal</option>
                  <option value="SECURITY">Security</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading requirements...</p>
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No requirements found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequirements.map((req) => (
                  <div
                    key={req.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedIds.has(req.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSelection(req.id)}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(req.id)}
                        onChange={() => toggleSelection(req.id)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {req.title}
                          </h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {req.category}
                          </span>
                        </div>
                        {req.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {req.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleInsert}
              disabled={selectedIds.size === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Insert {selectedIds.size} Requirement{selectedIds.size !== 1 ? 's' : ''}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
