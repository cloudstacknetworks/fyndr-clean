"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";

interface ActivityFiltersProps {
  onFiltersChange: (filters: any) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ActivityFilters({ onFiltersChange, isOpen: controlledIsOpen, onToggle }: ActivityFiltersProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [filters, setFilters] = useState<any>({
    eventType: null,
    actorRole: null,
    dateFrom: null,
    dateTo: null,
    keyword: null
  });

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const applyFilters = () => {
    onFiltersChange(filters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      eventType: null,
      actorRole: null,
      dateFrom: null,
      dateTo: null,
      keyword: null
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.eventType) count++;
    if (filters.actorRole) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.keyword) count++;
    return count;
  };

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Activity Filters</span>
          {activeFilterCount() > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
              {activeFilterCount()}
            </span>
          )}
        </div>
        <X className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-4 border-t space-y-4">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <select
              value={filters.eventType || ""}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Events</option>
              <option value="RFP_CREATED">RFP Created</option>
              <option value="RFP_UPDATED">RFP Updated</option>
              <option value="SUPPLIER_INVITATION_SENT">Supplier Invitation Sent</option>
              <option value="SUPPLIER_PORTAL_LOGIN">Supplier Portal Login</option>
              <option value="SUPPLIER_RESPONSE_DRAFT_SAVE">Response Draft Saved</option>
              <option value="SUPPLIER_RESPONSE_SUBMITTED">Response Submitted</option>
              <option value="SUPPLIER_ATTACHMENT_UPLOADED">Attachment Uploaded</option>
              <option value="SUPPLIER_ATTACHMENT_DELETED">Attachment Deleted</option>
              <option value="AI_EXTRACTION_RUN">AI Extraction Run</option>
              <option value="SUPPLIER_COMPARISON_RUN">Comparison Run</option>
              <option value="COMPARISON_AI_SUMMARY_RUN">AI Summary Generated</option>
              <option value="COMPARISON_NARRATIVE_GENERATED">Narrative Generated</option>
              <option value="COMPARISON_REPORT_GENERATED">Report Generated</option>
              <option value="READINESS_RECALCULATED">Readiness Recalculated</option>
              <option value="SUPPLIER_QUESTION_CREATED">Question Created</option>
              <option value="SUPPLIER_QUESTION_ANSWERED">Question Answered</option>
              <option value="SUPPLIER_BROADCAST_CREATED">Broadcast Created</option>
              <option value="NOTIFICATION_SENT">Notification Sent</option>
            </select>
          </div>

          {/* Actor Role */}
          <div>
            <label className="block text-sm font-medium mb-2">Actor Role</label>
            <select
              value={filters.actorRole || ""}
              onChange={(e) => setFilters({ ...filters, actorRole: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="BUYER">Buyer</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
                className="border rounded px-3 py-2 text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
                className="border rounded px-3 py-2 text-sm"
                placeholder="To"
              />
            </div>
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-sm font-medium mb-2">Keyword Search</label>
            <input
              type="text"
              placeholder="Search in activity summaries..."
              value={filters.keyword || ""}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value || null })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={applyFilters}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
