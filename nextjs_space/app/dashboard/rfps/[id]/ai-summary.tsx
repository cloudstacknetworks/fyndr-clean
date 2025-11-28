"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface AISummary {
  overview: string;
  goals: string;
  dates: string;
  budget: string;
  risks: string;
}

interface AISummaryProps {
  rfpId: string;
}

export default function AISummary({ rfpId }: AISummaryProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rfps/${rfpId}/summary`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerateSummary();
  };

  return (
    <div className="mt-8">
      {/* Generate Button */}
      {!summary && !loading && (
        <button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-5 w-5" />
          Generate Executive Summary
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
            <p className="text-purple-900 font-medium">
              Generating executive summary...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-900 font-semibold mb-1">
                Failed to Generate Summary
              </h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Summary Display */}
      {summary && !loading && (
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">
                  AI Executive Summary
                </h2>
              </div>
              <button
                onClick={handleGenerateSummary}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* High-Level Overview */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-700 font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    High-Level Overview
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.overview}
                  </p>
                </div>
              </div>
            </div>

            {/* Goals & Requirements */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Goals & Requirements
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.goals}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Dates & Deadlines */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Key Dates & Deadlines
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.dates}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget & Constraints */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-green-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 font-bold text-lg">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Budget & Constraints
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.budget}
                  </p>
                </div>
              </div>
            </div>

            {/* Risks & Considerations */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold text-lg">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Risks & Considerations
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.risks}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
