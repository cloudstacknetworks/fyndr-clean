'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Building2, Users, Loader2 } from 'lucide-react';

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

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    rfps: [],
    companies: [],
    suppliers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  useEffect(() => {
    if (query.length < 2) {
      setResults({ rfps: [], companies: [], suppliers: [] });
      setIsOpen(false);
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
          setIsOpen(true);
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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    if (!isOpen) return;

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
        setIsOpen(false);
        inputRef.current?.blur();
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
    
    setIsOpen(false);
    setQuery('');
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

  const totalResults = results.rfps.length + results.companies.length + results.suppliers.length;
  const hasResults = totalResults > 0;

  return (
    <div ref={searchRef} className="relative w-80">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && hasResults) {
              setIsOpen(true);
            }
          }}
          placeholder="Search RFPs, Companies, Suppliers..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
          {!hasResults && !isLoading && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {/* RFPs Section */}
          {results.rfps.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
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
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
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
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
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
      )}
    </div>
  );
}
