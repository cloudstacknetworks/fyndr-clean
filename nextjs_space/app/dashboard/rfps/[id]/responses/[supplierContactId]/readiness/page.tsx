"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Shield,
  FileCheck,
  Loader2,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface CategoryBreakdown {
  category: string;
  score: number;
  totalItems: number;
  completedItems: number;
  percentage: number;
  weight: number;
}

interface ComplianceFlag {
  flagType: string;
  severity: "high" | "medium" | "low";
  message: string;
  requirement: string;
}

interface MissingRequirement {
  requirement: string;
  category: string;
  severity: "critical" | "important" | "optional";
  suggestedFix: string;
}

interface ReadinessInsights {
  summary: string;
  topRisks: string[];
  mitigation: string[];
  standpointAnalysis: string;
  competitivePositioning: string;
}

interface ReadinessData {
  readinessScore: number | null;
  readinessBreakdown: CategoryBreakdown[] | null;
  complianceFlags: ComplianceFlag[] | null;
  missingRequirements: MissingRequirement[] | null;
  readinessInsights: ReadinessInsights | null;
  supplierName: string;
}

export default function ReadinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params.id as string;
  const supplierContactId = params.supplierContactId as string;
  
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    fetchReadinessData();
  }, []);

  const fetchReadinessData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/rfps/${rfpId}/responses/${supplierContactId}/readiness`);
      if (!res.ok) {
        throw new Error("Failed to fetch readiness data");
      }
      
      const readinessData = await res.json();
      setData(readinessData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runCalculation = async () => {
    try {
      setCalculating(true);
      const responseRes = await fetch(`/api/dashboard/rfps/${rfpId}/responses`);
      const responsesData = await responseRes.json();
      
      const response = responsesData.find((r: any) => r.supplierContactId === supplierContactId);
      if (!response || !response.responseId) {
        throw new Error("Response not found");
      }

      const res = await fetch(`/api/dashboard/rfps/${rfpId}/responses/${response.responseId}/readiness/run`, {
        method: "POST"
      });
      
      if (!res.ok) {
        throw new Error("Failed to run calculation");
      }
      
      await fetchReadinessData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  const generateAIInsights = async () => {
    try {
      setGeneratingAI(true);
      const responseRes = await fetch(`/api/dashboard/rfps/${rfpId}/responses`);
      const responsesData = await responseRes.json();
      
      const response = responsesData.find((r: any) => r.supplierContactId === supplierContactId);
      if (!response || !response.responseId) {
        throw new Error("Response not found");
      }

      const res = await fetch(`/api/dashboard/rfps/${rfpId}/responses/${response.responseId}/readiness/ai`, {
        method: "POST"
      });
      
      if (!res.ok) {
        throw new Error("Failed to generate AI insights");
      }
      
      await fetchReadinessData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "high" || severity === "critical") return "text-red-600 bg-red-50";
    if (severity === "medium" || severity === "important") return "text-amber-600 bg-amber-50";
    return "text-blue-600 bg-blue-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error || "No data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" data-demo-element="readiness-detail-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/rfps/${rfpId}/responses/${supplierContactId}`}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Supplier Readiness Analysis
            </h1>
            <p className="text-gray-600 mt-1">{data.supplierName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runCalculation}
            disabled={calculating}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            data-demo-action="run-calculation"
          >
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {calculating ? "Calculating..." : "Recalculate"}
          </button>
          <button
            onClick={generateAIInsights}
            disabled={generatingAI || !data.readinessScore}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            data-demo-action="generate-ai-insights"
          >
            {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generatingAI ? "Generating..." : "AI Insights"}
          </button>
        </div>
      </div>

      {/* Overall Score */}
      {data.readinessScore !== null && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Overall Readiness Score</h2>
              <p className="text-gray-600 text-sm mt-1">Weighted score across all categories</p>
            </div>
            <div className={`text-4xl font-bold px-6 py-3 rounded-lg ${getScoreColor(data.readinessScore)}`}>
              {data.readinessScore}%
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {data.readinessBreakdown && data.readinessBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Category Breakdown
          </h2>
          <div className="space-y-4">
            {data.readinessBreakdown.map((category, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{category.category}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(category.score)}`}>
                    {category.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${category.score >= 80 ? 'bg-green-500' : category.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{category.completedItems} of {category.totalItems} items complete</span>
                  {category.weight > 0 && <span>Weight: {(category.weight * 100).toFixed(0)}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Requirements */}
      {data.missingRequirements && data.missingRequirements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Missing Requirements ({data.missingRequirements.length})
          </h2>
          <div className="space-y-3">
            {data.missingRequirements.map((req, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{req.requirement}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(req.severity)}`}>
                        {req.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{req.category}</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Suggested Fix:</span> {req.suggestedFix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Flags */}
      {data.complianceFlags && data.complianceFlags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Flags ({data.complianceFlags.length})
          </h2>
          <div className="space-y-3">
            {data.complianceFlags.map((flag, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${flag.severity === 'high' ? 'text-red-500' : flag.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{flag.flagType}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(flag.severity)}`}>
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{flag.message}</p>
                    <p className="text-sm text-gray-600">Requirement: {flag.requirement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {data.readinessInsights && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Generated Insights
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Executive Summary</h3>
              <p className="text-gray-700">{data.readinessInsights.summary}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Top Risks</h3>
              <ul className="list-disc list-inside space-y-1">
                {data.readinessInsights.topRisks.map((risk, idx) => (
                  <li key={idx} className="text-gray-700">{risk}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Mitigation Steps</h3>
              <ul className="list-disc list-inside space-y-1">
                {data.readinessInsights.mitigation.map((step, idx) => (
                  <li key={idx} className="text-gray-700">{step}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Standpoint Analysis</h3>
              <p className="text-gray-700">{data.readinessInsights.standpointAnalysis}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Competitive Positioning</h3>
              <p className="text-gray-700">{data.readinessInsights.competitivePositioning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data.readinessScore && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Readiness Data Yet</h3>
          <p className="text-gray-600 mb-4">
            Run the readiness analysis to evaluate this supplier's response comprehensively.
          </p>
          <button
            onClick={runCalculation}
            disabled={calculating}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {calculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {calculating ? "Calculating..." : "Run Analysis"}
          </button>
        </div>
      )}
    </div>
  );
}
