'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  CheckSquare,
  Lightbulb,
  Shield,
  TrendingUp,
  Video,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AIInsightsPanelProps {
  responseId: string;
  extractedData: {
    extractedPricing: any;
    extractedRequirementsCoverage: any;
    extractedTechnicalClaims: any;
    extractedAssumptions: any;
    extractedRisks: any;
    extractedDifferentiators: any;
    extractedDemoSummary: any;
    extractedFilesMetadata: any;
  };
}

export default function AIInsightsPanel({ responseId, extractedData }: AIInsightsPanelProps) {
  const router = useRouter();
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const hasAnyExtraction = Object.values(extractedData).some(val => val !== null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleRunExtraction = async () => {
    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch(`/api/supplier/responses/${responseId}/extract/all`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Extraction failed');
      }

      // Reload the page to show updated data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsExtracting(false);
    }
  };

  if (!hasAnyExtraction) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Extracted Insights</h3>
        </div>
        
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">No extracted insights yet</p>
          <button
            onClick={handleRunExtraction}
            disabled={isExtracting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Running AI Extraction...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Run AI Extraction
              </>
            )}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Extracted Insights</h3>
          </div>
          <button
            onClick={handleRunExtraction}
            disabled={isExtracting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Re-running...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Re-run Extraction
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {/* Pricing Summary */}
        {extractedData.extractedPricing && (
          <InsightSection
            title="Pricing Summary"
            icon={DollarSign}
            isExpanded={expandedSections.has('pricing')}
            onToggle={() => toggleSection('pricing')}
          >
            <PricingInsight data={extractedData.extractedPricing} />
          </InsightSection>
        )}

        {/* Requirements Coverage */}
        {extractedData.extractedRequirementsCoverage && (
          <InsightSection
            title="Requirements Coverage"
            icon={CheckSquare}
            isExpanded={expandedSections.has('requirements')}
            onToggle={() => toggleSection('requirements')}
          >
            <RequirementsInsight data={extractedData.extractedRequirementsCoverage} />
          </InsightSection>
        )}

        {/* Technical Claims */}
        {extractedData.extractedTechnicalClaims && (
          <InsightSection
            title="Technical Claims"
            icon={Lightbulb}
            isExpanded={expandedSections.has('technical')}
            onToggle={() => toggleSection('technical')}
          >
            <TechnicalInsight data={extractedData.extractedTechnicalClaims} />
          </InsightSection>
        )}

        {/* Differentiators */}
        {extractedData.extractedDifferentiators && (
          <InsightSection
            title="Competitive Differentiators"
            icon={TrendingUp}
            isExpanded={expandedSections.has('differentiators')}
            onToggle={() => toggleSection('differentiators')}
          >
            <DifferentiatorsInsight data={extractedData.extractedDifferentiators} />
          </InsightSection>
        )}

        {/* Risks */}
        {extractedData.extractedRisks && (
          <InsightSection
            title="Identified Risks"
            icon={Shield}
            isExpanded={expandedSections.has('risks')}
            onToggle={() => toggleSection('risks')}
          >
            <RisksInsight data={extractedData.extractedRisks} />
          </InsightSection>
        )}

        {/* Assumptions */}
        {extractedData.extractedAssumptions && (
          <InsightSection
            title="Assumptions"
            icon={FileText}
            isExpanded={expandedSections.has('assumptions')}
            onToggle={() => toggleSection('assumptions')}
          >
            <AssumptionsInsight data={extractedData.extractedAssumptions} />
          </InsightSection>
        )}

        {/* Demo Summary */}
        {extractedData.extractedDemoSummary && (
          <InsightSection
            title="Demo Summary"
            icon={Video}
            isExpanded={expandedSections.has('demo')}
            onToggle={() => toggleSection('demo')}
          >
            <DemoInsight data={extractedData.extractedDemoSummary} />
          </InsightSection>
        )}

        {/* File Metadata */}
        {extractedData.extractedFilesMetadata && (
          <InsightSection
            title="Analyzed Files"
            icon={FileText}
            isExpanded={expandedSections.has('metadata')}
            onToggle={() => toggleSection('metadata')}
          >
            <FilesMetadataInsight data={extractedData.extractedFilesMetadata} />
          </InsightSection>
        )}
      </div>
    </div>
  );
}

// Helper Components

interface InsightSectionProps {
  title: string;
  icon: any;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function InsightSection({ title, icon: Icon, isExpanded, onToggle, children }: InsightSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-indigo-600" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 pt-0 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

function PricingInsight({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.pricingModel && (
        <div>
          <span className="text-sm font-medium text-gray-700">Pricing Model:</span>
          <p className="mt-1 text-gray-900">{data.pricingModel}</p>
        </div>
      )}
      {data.lineItems && data.lineItems.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">Line Items:</span>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.lineItems.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-sm text-gray-900">{item.item}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{item.quantity} {item.unit}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{item.unitPrice}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {data.message && (
        <p className="text-sm text-gray-600 italic">{data.message}</p>
      )}
    </div>
  );
}

function RequirementsInsight({ data }: { data: any }) {
  const coveragePercentage = data.coveragePercentage || 0;
  
  return (
    <div className="space-y-4">
      <div>
        <span className="text-sm font-medium text-gray-700">Coverage Percentage:</span>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                coveragePercentage >= 80 ? 'bg-green-500' :
                coveragePercentage >= 50 ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${coveragePercentage}%` }}
            />
          </div>
          <span className="text-lg font-semibold text-gray-900">{coveragePercentage}%</span>
        </div>
      </div>
      {data.requirements && data.requirements.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">Requirements:</span>
          <div className="mt-2 space-y-2">
            {data.requirements.slice(0, 10).map((req: any, idx: number) => (
              <div key={idx} className="p-3 bg-white rounded border border-gray-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-900 flex-1">{req.requirement}</p>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                    req.complianceLevel === 'Meets' ? 'bg-green-100 text-green-700' :
                    req.complianceLevel === 'Partially Meets' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.complianceLevel}
                  </span>
                </div>
                {req.notes && (
                  <p className="mt-1 text-xs text-gray-600">{req.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.message && (
        <p className="text-sm text-gray-600 italic">{data.message}</p>
      )}
    </div>
  );
}

function TechnicalInsight({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.technicalClaims && data.technicalClaims.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">Technical Claims:</span>
          <ul className="mt-2 space-y-2">
            {data.technicalClaims.map((claim: any, idx: number) => (
              <li key={idx} className="p-3 bg-white rounded border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{claim.category || 'General'}</p>
                <p className="text-sm text-gray-700 mt-1">{claim.claim}</p>
                {claim.evidence && (
                  <p className="text-xs text-gray-500 mt-1">Evidence: {claim.evidence}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <pre className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200 overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function DifferentiatorsInsight({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.differentiators && data.differentiators.length > 0 && (
        <ul className="space-y-2">
          {data.differentiators.map((diff: any, idx: number) => (
            <li key={idx} className="p-3 bg-white rounded border border-gray-200">
              <p className="text-sm font-medium text-indigo-700">{diff.category || 'Differentiator'}</p>
              <p className="text-sm text-gray-900 mt-1">{diff.differentiator}</p>
              {diff.value && (
                <p className="text-xs text-gray-600 mt-1">Value: {diff.value}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.message && (
        <p className="text-sm text-gray-600 italic">{data.message}</p>
      )}
    </div>
  );
}

function RisksInsight({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.risks && data.risks.length > 0 && (
        <ul className="space-y-2">
          {data.risks.map((risk: any, idx: number) => (
            <li key={idx} className="p-3 bg-white rounded border border-red-200">
              <p className="text-sm font-medium text-red-700">{risk.category || 'Risk'}</p>
              <p className="text-sm text-gray-900 mt-1">{risk.risk}</p>
              <div className="mt-2 flex gap-4 text-xs text-gray-600">
                {risk.likelihood && <span>Likelihood: {risk.likelihood}</span>}
                {risk.impact && <span>Impact: {risk.impact}</span>}
              </div>
              {risk.mitigation && (
                <p className="text-xs text-gray-600 mt-1">Mitigation: {risk.mitigation}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.message && (
        <p className="text-sm text-gray-600 italic">{data.message}</p>
      )}
    </div>
  );
}

function AssumptionsInsight({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.assumptions && data.assumptions.length > 0 && (
        <ul className="space-y-2">
          {data.assumptions.map((assumption: any, idx: number) => (
            <li key={idx} className="p-3 bg-white rounded border border-gray-200">
              <p className="text-sm font-medium text-gray-900">{assumption.type || 'Assumption'}</p>
              <p className="text-sm text-gray-700 mt-1">{assumption.assumption}</p>
              {assumption.impact && (
                <p className="text-xs text-gray-600 mt-1">Impact: {assumption.impact}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.message && (
        <p className="text-sm text-gray-600 italic">{data.message}</p>
      )}
    </div>
  );
}

function DemoInsight({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.demoLink && (
        <div>
          <span className="text-sm font-medium text-gray-700">Demo Link:</span>
          <a href={data.demoLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-indigo-600 hover:underline">
            {data.demoLink}
          </a>
        </div>
      )}
      {data.overview && (
        <div>
          <span className="text-sm font-medium text-gray-700">Overview:</span>
          <p className="mt-1 text-sm text-gray-900">{data.overview}</p>
        </div>
      )}
      {data.keyCapabilities && data.keyCapabilities.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">Key Capabilities:</span>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
            {data.keyCapabilities.map((cap: string, idx: number) => (
              <li key={idx}>{cap}</li>
            ))}
          </ul>
        </div>
      )}
      {data.gapsObserved && data.gapsObserved.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">Gaps Observed:</span>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
            {data.gapsObserved.map((gap: string, idx: number) => (
              <li key={idx}>{gap}</li>
            ))}
          </ul>
        </div>
      )}
      {data.toneAndMaturity && (
        <div>
          <span className="text-sm font-medium text-gray-700">Tone and Maturity:</span>
          <p className="mt-1 text-sm text-gray-900">{data.toneAndMaturity}</p>
        </div>
      )}
    </div>
  );
}

function FilesMetadataInsight({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">
        <span className="font-medium">Files Analyzed:</span> {data.filesAnalyzed || 0}
      </p>
      {data.fileNames && data.fileNames.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">File Names:</span>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
            {data.fileNames.map((name: string, idx: number) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      {data.extractedAt && (
        <p className="text-xs text-gray-500">
          Extracted at: {new Date(data.extractedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
