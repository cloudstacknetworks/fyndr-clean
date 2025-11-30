/**
 * Readiness Panel Component (STEP 20)
 * Displays compliance, diversity, mandatory requirements, risk flags, and overall readiness
 */

'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  FileCheck,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { getReadinessStyles } from '@/lib/readiness-engine';
import { useRouter } from 'next/navigation';

interface ReadinessPanelProps {
  responseId: string;
  readinessData: {
    complianceFindings?: any;
    diversityMetadata?: any;
    mandatoryRequirementsStatus?: any;
    riskFlags?: any;
    readinessIndicator?: string;
    readinessRationale?: string;
  };
}

export default function ReadinessPanel({ responseId, readinessData }: ReadinessPanelProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasAnyData = Boolean(
    readinessData.complianceFindings ||
      readinessData.diversityMetadata ||
      readinessData.mandatoryRequirementsStatus ||
      readinessData.riskFlags ||
      readinessData.readinessIndicator
  );

  const handleRunAllExtractions = async () => {
    setIsRunningAll(true);
    setError(null);

    try {
      // Run all 4 extraction endpoints sequentially
      const endpoints = [
        `/api/supplier/responses/${responseId}/extract/compliance`,
        `/api/supplier/responses/${responseId}/extract/mandatories`,
        `/api/supplier/responses/${responseId}/extract/diversity`,
        `/api/supplier/responses/${responseId}/extract/risk-flags`,
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, { method: 'POST' });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to run ${endpoint}`);
        }
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunningAll(false);
    }
  };

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Supplier Readiness Analysis</h3>
          <TrendingUp className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            No readiness analysis has been performed yet. Run all extractions to generate
            comprehensive readiness insights.
          </p>
          <button
            onClick={handleRunAllExtractions}
            disabled={isRunningAll}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {isRunningAll ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <FileCheck className="w-5 h-5 mr-2" />
                Run All Extractions
              </>
            )}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  const readinessStyles = readinessData.readinessIndicator
    ? getReadinessStyles(readinessData.readinessIndicator as any)
    : null;

  return (
    <div className="space-y-6">
      {/* Overall Readiness Indicator */}
      {readinessData.readinessIndicator && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Supplier Readiness Indicator</h3>
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span
              className={`px-6 py-3 rounded-lg text-lg font-bold ${readinessStyles?.bgColor} ${readinessStyles?.textColor} ${readinessStyles?.borderColor} border-2`}
            >
              {readinessStyles?.label.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed">{readinessData.readinessRationale}</p>
        </div>
      )}

      {/* Compliance Findings */}
      {readinessData.complianceFindings && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={() => toggleSection('compliance')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Compliance Findings</h3>
            </div>
            {expandedSections.compliance ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.compliance && (
            <div className="mt-6 space-y-4">
              {/* Overall Score */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">Overall Compliance Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                      style={{
                        width: `${readinessData.complianceFindings.overallComplianceScore}%`,
                      }}
                    />
                  </div>
                  <span className="font-bold text-lg text-gray-900">
                    {readinessData.complianceFindings.overallComplianceScore}/100
                  </span>
                </div>
              </div>

              {/* Security Compliance */}
              {readinessData.complianceFindings.securityCompliance && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Security Compliance</h4>
                  {readinessData.complianceFindings.securityCompliance.certifications?.length >
                    0 && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Certifications: </span>
                      <span className="text-sm text-gray-900">
                        {readinessData.complianceFindings.securityCompliance.certifications.join(
                          ', '
                        )}
                      </span>
                    </div>
                  )}
                  {readinessData.complianceFindings.securityCompliance.gaps?.length > 0 && (
                    <div className="text-sm text-red-600">
                      Gaps: {readinessData.complianceFindings.securityCompliance.gaps.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Privacy Compliance */}
              {readinessData.complianceFindings.privacyCompliance && (
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Privacy Compliance</h4>
                  {readinessData.complianceFindings.privacyCompliance.standards?.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Standards: </span>
                      <span className="text-sm text-gray-900">
                        {readinessData.complianceFindings.privacyCompliance.standards.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Contractual Red Flags */}
              {readinessData.complianceFindings.contractualRedFlags?.length > 0 && (
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Contractual Red Flags</h4>
                  <div className="space-y-2">
                    {readinessData.complianceFindings.contractualRedFlags.map(
                      (flag: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-sm ${
                            flag.severity === 'HIGH'
                              ? 'bg-red-50 text-red-800'
                              : flag.severity === 'MEDIUM'
                              ? 'bg-yellow-50 text-yellow-800'
                              : 'bg-gray-50 text-gray-800'
                          }`}
                        >
                          <span className="font-semibold">[{flag.severity}]</span> {flag.flag}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Diversity Metadata */}
      {readinessData.diversityMetadata && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={() => toggleSection('diversity')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Diversity Metadata</h3>
            </div>
            {expandedSections.diversity ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.diversity && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">Diversity Score</span>
                <span className="font-bold text-lg text-purple-600">
                  {readinessData.diversityMetadata.diversityScore}/100
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {readinessData.diversityMetadata.womanOwned && (
                  <div className="px-4 py-2 bg-pink-50 text-pink-800 rounded-lg text-sm font-semibold text-center">
                    Woman-Owned
                  </div>
                )}
                {readinessData.diversityMetadata.minorityOwned && (
                  <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm font-semibold text-center">
                    Minority-Owned
                  </div>
                )}
                {readinessData.diversityMetadata.veteranOwned && (
                  <div className="px-4 py-2 bg-green-50 text-green-800 rounded-lg text-sm font-semibold text-center">
                    Veteran-Owned
                  </div>
                )}
                {readinessData.diversityMetadata.smallBusiness && (
                  <div className="px-4 py-2 bg-indigo-50 text-indigo-800 rounded-lg text-sm font-semibold text-center">
                    Small Business
                  </div>
                )}
                {readinessData.diversityMetadata.localBusiness && (
                  <div className="px-4 py-2 bg-purple-50 text-purple-800 rounded-lg text-sm font-semibold text-center">
                    Local Business
                  </div>
                )}
              </div>

              {readinessData.diversityMetadata.certifications?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
                  <div className="space-y-2">
                    {readinessData.diversityMetadata.certifications.map(
                      (cert: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <span className="font-semibold text-gray-900">{cert.type}</span>
                          <span className="text-sm text-gray-600 ml-2">({cert.source})</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mandatory Requirements Status */}
      {readinessData.mandatoryRequirementsStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={() => toggleSection('mandatories')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Mandatory Requirements Status</h3>
            </div>
            {expandedSections.mandatories ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.mandatories && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-6">
                {readinessData.mandatoryRequirementsStatus.overallMandatoryPass ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">All Mandatory Requirements Met</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-6 h-6" />
                    <span className="font-semibold">Mandatory Requirements Not Met</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {readinessData.mandatoryRequirementsStatus.unmetMandatoryCount}
                  </div>
                  <div className="text-sm text-red-600">Unmet Mandatory</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {readinessData.mandatoryRequirementsStatus.partiallyMetMandatoryCount}
                  </div>
                  <div className="text-sm text-yellow-600">Partially Met</div>
                </div>
              </div>

              {readinessData.mandatoryRequirementsStatus.unmetMandatoryList?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Unmet Requirements</h4>
                  <div className="space-y-2">
                    {readinessData.mandatoryRequirementsStatus.unmetMandatoryList.map(
                      (req: any, idx: number) => (
                        <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="font-semibold text-red-900">{req.requirement}</div>
                          <div className="text-sm text-red-700 mt-1">
                            Impact: {req.impact} | {req.notes}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Risk Flags */}
      {readinessData.riskFlags && Array.isArray(readinessData.riskFlags) && readinessData.riskFlags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={() => toggleSection('risks')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Risk Flags ({readinessData.riskFlags.length})
              </h3>
            </div>
            {expandedSections.risks ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.risks && (
            <div className="mt-6 space-y-3">
              {readinessData.riskFlags.map((risk: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    risk.severity === 'HIGH'
                      ? 'bg-red-50 border-red-500'
                      : risk.severity === 'MEDIUM'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-gray-50 border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          risk.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : risk.severity === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {risk.severity}
                      </span>
                      <span className="ml-2 font-semibold text-gray-900">{risk.category}</span>
                    </div>
                  </div>
                  <p className="text-gray-900 mb-2">{risk.description}</p>
                  {risk.impact && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Impact:</span> {risk.impact}
                    </p>
                  )}
                  {risk.mitigation && (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Mitigation:</span> {risk.mitigation}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Source: {risk.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Run All Extractions Button */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Update readiness analysis with latest data from all extraction endpoints
        </p>
        <button
          onClick={handleRunAllExtractions}
          disabled={isRunningAll}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
        >
          {isRunningAll ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Running Analysis...
            </>
          ) : (
            <>
              <FileCheck className="w-5 h-5 mr-2" />
              Refresh Readiness Analysis
            </>
          )}
        </button>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
