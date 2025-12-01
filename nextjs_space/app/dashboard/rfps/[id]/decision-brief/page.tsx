/**
 * STEP 34: Executive Decision Brief Page (Buyer UI)
 * 
 * Displays comprehensive decision brief with supplier summaries, recommendations,
 * risk analysis, timeline, and AI-generated narratives.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Loader2,
  Sparkles,
  Copy,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Option3Indicator } from '@/app/components/option3/option3-indicator';

interface DecisionBriefData {
  snapshot: {
    rfpId: string;
    rfpTitle: string;
    rfpOwnerName: string | null;
    rfpBudget: number | null;
    rfpStatus: string;
    rfpStage: string;
    coreRecommendation: {
      recommendedSupplierId: string | null;
      recommendedSupplierName: string | null;
      recommendationType: string;
      confidenceScore: number;
      primaryRationaleBullets: string[];
    };
    supplierSummaries: Array<{
      supplierId: string;
      supplierName: string;
      organization: string | null;
      finalScore: number | null;
      readinessScore: number | null;
      readinessTier: string | null;
      pricingScore: number | null;
      pricingPosition: string | null;
      submissionSpeedDays: number | null;
      reliabilityIndex: number | null;
      headlineRiskLevel: 'low' | 'medium' | 'high';
    }>;
    riskSummary: {
      overallRiskLevel: 'low' | 'medium' | 'high';
      keyRisks: string[];
      mitigationActions: string[];
    };
    timelineSummary: {
      currentStage: string;
      upcomingMilestones: Array<{
        label: string;
        date: string | null;
        daysRemaining: number | null;
      }>;
      suggestedNextSteps: string[];
    };
    narrative: {
      executiveSummary: string;
      procurementNotes: string;
      itNotes: string;
      financeNotes: string;
    };
    generatedAt: string;
    generatedUsingAI: boolean;
    version: number;
  };
  meta: {
    canGenerateAI: boolean;
    hasAiNarrative: boolean;
    lastGeneratedAt: string | null;
    version: number;
  };
}

export default function DecisionBriefPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params?.id as string;

  const [data, setData] = useState<DecisionBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'executive' | 'procurement' | 'it' | 'finance'>('executive');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    fetchDecisionBrief();
  }, [rfpId]);

  const fetchDecisionBrief = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/decision-brief`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch decision brief');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching decision brief:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSummary = async () => {
    try {
      setRegenerating(true);
      setError(null);
      const response = await fetch(`/api/dashboard/rfps/${rfpId}/decision-brief/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audiences: ['executive', 'procurement', 'it', 'finance'] }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate AI narrative');
      }

      // Refresh the page data
      await fetchDecisionBrief();
    } catch (err) {
      console.error('Error regenerating summary:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/dashboard/rfps/${rfpId}/decision-brief/pdf`, '_blank');
  };

  const handleCopySection = (section: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'recommend_award':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'recommend_negotiation':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'recommend_rebid':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getReadinessColor = (tier: string | null) => {
    switch (tier) {
      case 'Ready':
        return 'bg-green-100 text-green-800';
      case 'Conditional':
        return 'bg-amber-100 text-amber-800';
      case 'Not Ready':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Decision Brief</h3>
              <p className="text-sm text-red-700 mt-1">{error || 'Unable to load decision brief data'}</p>
              <button
                onClick={fetchDecisionBrief}
                className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { snapshot, meta } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link href={`/dashboard/rfps/${rfpId}`}>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Executive Decision Brief</h1>
              <p className="text-sm text-gray-600 mt-1">{snapshot.rfpTitle}</p>
            </div>
          </div>
          <Option3Indicator />
        </div>

        {/* Meta Info */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Stage: {snapshot.rfpStage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Generated: {new Date(snapshot.generatedAt).toLocaleString()}</span>
          </div>
          {snapshot.rfpBudget && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Budget: ${snapshot.rfpBudget.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={handleRegenerateSummary}
            disabled={regenerating || !meta.canGenerateAI}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {regenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{regenerating ? 'Regenerating...' : 'Regenerate Summary'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <Link href={`/dashboard/rfps/${rfpId}/compare`}>
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Comparison</span>
            </button>
          </Link>

          <Link href={`/dashboard/rfps/${rfpId}/activity`}>
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Activity Log</span>
            </button>
          </Link>
        </div>

        {!meta.hasAiNarrative && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              This brief contains template-based narratives. Click "Regenerate Summary" to generate AI-powered insights.
            </p>
          </div>
        )}
      </div>

      {/* 1. Recommendation Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recommendation</h2>
        </div>

        <div className={`border-l-4 p-4 rounded-r-lg ${getRecommendationColor(snapshot.coreRecommendation.recommendationType)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">
              {snapshot.coreRecommendation.recommendationType.replace('_', ' ').toUpperCase()}
            </h3>
            <span className="text-sm font-medium">
              Confidence: {snapshot.coreRecommendation.confidenceScore}%
            </span>
          </div>

          {snapshot.coreRecommendation.recommendedSupplierName && (
            <p className="font-medium mb-2">
              Recommended Supplier: {snapshot.coreRecommendation.recommendedSupplierName}
            </p>
          )}

          <ul className="space-y-1 text-sm">
            {snapshot.coreRecommendation.primaryRationaleBullets.map((bullet, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="flex-shrink-0 mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2. Supplier Summary Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Supplier Summary</h2>
        </div>

        {snapshot.supplierSummaries.length === 0 ? (
          <p className="text-sm text-gray-600">No supplier responses submitted yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.supplierSummaries.map((supplier) => (
              <div
                key={supplier.supplierId}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{supplier.supplierName}</h3>
                    {supplier.organization && (
                      <p className="text-xs text-gray-600">{supplier.organization}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(supplier.headlineRiskLevel)}`}>
                    {supplier.headlineRiskLevel.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Final Score:</span>
                    <p className="font-semibold text-gray-900">{supplier.finalScore || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Readiness:</span>
                    <p className="font-semibold">
                      <span className={`px-2 py-0.5 rounded text-xs ${getReadinessColor(supplier.readinessTier)}`}>
                        {supplier.readinessTier || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Pricing:</span>
                    <p className="font-semibold text-gray-900">{supplier.pricingPosition || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Speed:</span>
                    <p className="font-semibold text-gray-900">
                      {supplier.submissionSpeedDays !== null ? `${supplier.submissionSpeedDays} days` : 'N/A'}
                    </p>
                  </div>
                </div>

                {supplier.reliabilityIndex !== null && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Reliability Index:</span>
                      <span className="font-semibold text-indigo-600">{supplier.reliabilityIndex}/100</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Risk Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Risk & Mitigation</h2>
        </div>

        <div className={`border-l-4 p-4 rounded-r-lg mb-4 ${getRiskColor(snapshot.riskSummary.overallRiskLevel)}`}>
          <p className="font-semibold mb-2">
            Overall Risk Level: {snapshot.riskSummary.overallRiskLevel.toUpperCase()}
          </p>

          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-sm mb-1">Key Risks:</h3>
              <ul className="space-y-1 text-sm">
                {snapshot.riskSummary.keyRisks.length > 0 ? (
                  snapshot.riskSummary.keyRisks.map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-1" />
                      <span>{risk}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm">No significant risks identified</li>
                )}
              </ul>
            </div>

            {snapshot.riskSummary.mitigationActions.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-1">Mitigation Actions:</h3>
                <ul className="space-y-1 text-sm">
                  {snapshot.riskSummary.mitigationActions.map((action, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 flex-shrink-0 mt-1" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Timeline Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Timeline & Next Steps</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-gray-700 mb-2">Upcoming Milestones:</h3>
            {snapshot.timelineSummary.upcomingMilestones.length > 0 ? (
              <div className="space-y-2">
                {snapshot.timelineSummary.upcomingMilestones.map((milestone, index) => (
                  <div key={index} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="font-medium">{milestone.label}</span>
                    <div className="flex items-center space-x-3">
                      {milestone.date && (
                        <span className="text-gray-600">
                          {new Date(milestone.date).toLocaleDateString()}
                        </span>
                      )}
                      {milestone.daysRemaining !== null && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          milestone.daysRemaining < 0 ? 'bg-red-100 text-red-800' :
                          milestone.daysRemaining <= 7 ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {milestone.daysRemaining < 0 ? `${Math.abs(milestone.daysRemaining)} days overdue` :
                           milestone.daysRemaining === 0 ? 'Today' :
                           milestone.daysRemaining === 1 ? 'Tomorrow' :
                           `${milestone.daysRemaining} days`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No upcoming milestones scheduled</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-sm text-gray-700 mb-2">Suggested Next Steps:</h3>
            <ul className="space-y-1 text-sm">
              {snapshot.timelineSummary.suggestedNextSteps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="flex-shrink-0 mt-1">→</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. AI Narrative Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Narrative</h2>
            {snapshot.generatedUsingAI && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                AI Generated
              </span>
            )}
          </div>
          <button
            onClick={() => handleCopySection('executive', snapshot.narrative.executiveSummary)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            {copiedSection === 'executive' ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Executive Summary (Always Visible) */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Executive Summary</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{snapshot.narrative.executiveSummary}</p>
        </div>

        {/* Persona-Specific Tabs (Option 3 Upgrade) */}
        <div className="mt-4">
          <div className="flex space-x-1 border-b border-gray-200 mb-4">
            {['executive', 'procurement', 'it', 'finance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                disabled={tab !== 'executive'}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                } ${tab !== 'executive' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'executive' && <span className="ml-1 text-xs">(Option 3)</span>}
              </button>
            ))}
          </div>

          {activeTab !== 'executive' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <Info className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-800">
                Persona-specific narratives are available in Option 3 upgrade. Contact your sales representative for more information.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
