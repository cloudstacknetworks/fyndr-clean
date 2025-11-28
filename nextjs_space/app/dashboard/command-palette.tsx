'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Building2, Users, Loader2, Command } from 'lucide-react';

interface RFPResult {
  id: string;
  title: string;
  status: string;
  description: string | null;
}

interface CompanyResult {
  id: string;
  name: string;
}

interface SupplierResult {
  id: string;
  name: string;
}

interface SearchResults {
  rfps: RFPResult[];
  companies: CompanyResult[];
  suppliers: SupplierResult[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    rfps: [],
    companies: [],
    suppliers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ rfps: [], companies: [], suppliers: [] });
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debounced search function
  useEffect(() => {
    if (query.length < 2) {
      setResults({ rfps: [], companies: [], suppliers: [] });
      return;
    }

    setIsLoading(true);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debouncing (300ms)
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // Get flat list of all results for keyboard navigation
  const getAllResults = () => {
    const allResults: Array<{ type: 'rfp' | 'company' | 'supplier'; item: any }> = [];
    
    results.rfps.forEach(item => allResults.push({ type: 'rfp', item }));
    results.companies.forEach(item => allResults.push({ type: 'company', item }));
    results.suppliers.forEach(item => allResults.push({ type: 'supplier', item }));
    
    return allResults;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = getAllResults();
    const maxIndex = allResults.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          const selected = allResults[selectedIndex];
          handleNavigate(selected.type, selected.item.id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Navigate to selected result
  const handleNavigate = (type: 'rfp' | 'company' | 'supplier', id: string) => {
    let path = '';
    
    switch (type) {
      case 'rfp':
        path = `/dashboard/rfps/${id}`;
        break;
      case 'company':
        path = `/dashboard/companies/${id}`;
        break;
      case 'supplier':
        path = `/dashboard/suppliers/${id}`;
        break;
    }
    
    onClose();
    router.push(path);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const totalResults = results.rfps.length + results.companies.length + results.suppliers.length;
  const hasResults = totalResults > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15vh] px-4"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search Input */}
        <div className="relative border-b border-gray-200">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search RFPs, Companies, Suppliers..."
            className="block w-full pl-12 pr-4 py-4 border-0 text-base placeholder-gray-500 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Empty State */}
          {query.length === 0 && (
            <div className="px-6 py-14 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Search for RFPs, Companies, or Suppliers
              </p>
              <p className="text-xs text-gray-400">
                Type at least 2 characters to start searching
              </p>
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && !hasResults && !isLoading && (
            <div className="px-6 py-14 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                No results found for "{query}"
              </p>
              <p className="text-xs text-gray-400">
                Try adjusting your search terms
              </p>
            </div>
          )}

          {/* RFPs Section */}
          {results.rfps.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-gray-50 sticky top-0">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  RFPs ({results.rfps.length})
                </h3>
              </div>
              {results.rfps.map((rfp, index) => {
                const flatIndex = index;
                const isSelected = selectedIndex === flatIndex;
                
                return (
                  <button
                    key={rfp.id}
                    onClick={() => handleNavigate('rfp', rfp.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {rfp.title}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                              rfp.status
                            )}`}
                          >
                            {rfp.status}
                          </span>
                        </div>
                        {rfp.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {rfp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Companies Section */}
          {results.companies.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-gray-50 sticky top-0">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Companies ({results.companies.length})
                </h3>
              </div>
              {results.companies.map((company, index) => {
                const flatIndex = results.rfps.length + index;
                const isSelected = selectedIndex === flatIndex;
                
                return (
                  <button
                    key={company.id}
                    onClick={() => handleNavigate('company', company.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {company.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Suppliers Section */}
          {results.suppliers.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 sticky top-0">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Suppliers ({results.suppliers.length})
                </h3>
              </div>
              {results.suppliers.map((supplier, index) => {
                const flatIndex = results.rfps.length + results.companies.length + index;
                const isSelected = selectedIndex === flatIndex;
                
                return (
                  <button
                    key={supplier.id}
                    onClick={() => handleNavigate('supplier', supplier.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {supplier.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">↵</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">ESC</kbd>
                <span>Close</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
