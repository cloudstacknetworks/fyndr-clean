"use client";

/**
 * STEP 64: AI Usage Card
 * Displays AI feature adoption metrics and coverage percentage
 */

import { Bot, FileText, Award, TrendingUp } from "lucide-react";

interface AiUsageData {
  aiSummariesCount: number;
  aiDecisionBriefsCount: number;
  aiScoringEventsCount: number;
  rfpsWithAIUsageCount: number;
  percentageRFPsWithAI: number;
}

interface AiUsageCardProps {
  data: AiUsageData;
}

export default function AiUsageCard({ data }: AiUsageCardProps) {
  const {
    aiSummariesCount,
    aiDecisionBriefsCount,
    aiScoringEventsCount,
    rfpsWithAIUsageCount,
    percentageRFPsWithAI,
  } = data;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Bot className="w-5 h-5 text-purple-600" />
        AI Feature Adoption
      </h3>

      <div className="space-y-4">
        {/* AI Summaries */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Executive Summaries</span>
          </div>
          <span className="text-lg font-bold text-purple-900">{aiSummariesCount}</span>
        </div>

        {/* Decision Briefs */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Decision Briefs</span>
          </div>
          <span className="text-lg font-bold text-blue-900">{aiDecisionBriefsCount}</span>
        </div>

        {/* Auto-Scoring */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Auto-Scoring Runs</span>
          </div>
          <span className="text-lg font-bold text-green-900">{aiScoringEventsCount}</span>
        </div>

        {/* Coverage Percentage */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">RFPs Using AI Features</span>
            <span className="text-2xl font-bold text-purple-900">{percentageRFPsWithAI}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percentageRFPsWithAI}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            {rfpsWithAIUsageCount} of total RFPs in period
          </div>
        </div>
      </div>
    </div>
  );
}
