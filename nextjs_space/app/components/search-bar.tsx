"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, FileText, Users, MessageSquare } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults(null);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&scope=all`);
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return (
      (results.rfps?.length || 0) +
      (results.suppliers?.length || 0) +
      (results.responses?.length || 0) +
      (results.questions?.length || 0) +
      (results.activity?.length || 0)
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search RFPs, suppliers, questions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && results && getTotalResults() > 0 && (
        <div className="absolute top-full mt-2 w-96 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {/* RFPs */}
          {results.rfps && results.rfps.length > 0 && (
            <div className="p-2 border-b">
              <div className="font-semibold text-sm text-gray-500 px-2 py-1 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                RFPs ({results.rfps.length})
              </div>
              {results.rfps.map((rfp: any) => (
                <Link
                  key={rfp.id}
                  href={`/dashboard/rfps/${rfp.id}`}
                  onClick={handleResultClick}
                  className="block px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <div className="font-medium text-sm">{rfp.title}</div>
                  <div className="text-xs text-gray-500">
                    {rfp.stage} • {new Date(rfp.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Suppliers */}
          {results.suppliers && results.suppliers.length > 0 && (
            <div className="p-2 border-b">
              <div className="font-semibold text-sm text-gray-500 px-2 py-1 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Suppliers ({results.suppliers.length})
              </div>
              {results.suppliers.map((supplier: any) => (
                <Link
                  key={supplier.id}
                  href={`/dashboard/rfps/${supplier.rfp.id}`}
                  onClick={handleResultClick}
                  className="block px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <div className="font-medium text-sm">{supplier.name}</div>
                  <div className="text-xs text-gray-500">
                    {supplier.organization || supplier.email} • {supplier.rfp.title}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Questions */}
          {results.questions && results.questions.length > 0 && (
            <div className="p-2 border-b">
              <div className="font-semibold text-sm text-gray-500 px-2 py-1 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Questions ({results.questions.length})
              </div>
              {results.questions.map((question: any) => (
                <Link
                  key={question.id}
                  href={`/dashboard/rfps/${question.rfp.id}`}
                  onClick={handleResultClick}
                  className="block px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <div className="font-medium text-sm line-clamp-2">{question.question}</div>
                  <div className="text-xs text-gray-500">{question.rfp.title}</div>
                </Link>
              ))}
            </div>
          )}

          {/* Responses */}
          {results.responses && results.responses.length > 0 && (
            <div className="p-2">
              <div className="font-semibold text-sm text-gray-500 px-2 py-1">
                Responses ({results.responses.length})
              </div>
              {results.responses.map((response: any) => (
                <Link
                  key={response.id}
                  href={`/dashboard/rfps/${response.rfp.id}/responses/${response.supplierContactId}`}
                  onClick={handleResultClick}
                  className="block px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <div className="font-medium text-sm">{response.supplierContact.name}</div>
                  <div className="text-xs text-gray-500">{response.rfp.title}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && results && getTotalResults() === 0 && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-96 bg-white border rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-gray-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
