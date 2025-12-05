"use client";

/**
 * STEP 64: Automation Impact Card
 * Side-by-side comparison of RFPs with/without automation
 */

import { Zap, TrendingDown } from "lucide-react";

interface AutomationImpactData {
  withAutomation: { avgCycleTime: number; rfpsCount: number };
  withoutAutomation: { avgCycleTime: number; rfpsCount: number };
}

interface AutomationImpactCardProps {
  data: AutomationImpactData;
}

export default function AutomationImpactCard({ data }: AutomationImpactCardProps) {
  const { withAutomation, withoutAutomation } = data;

  const improvement =
    withoutAutomation.avgCycleTime > 0
      ? Math.round(
          ((withoutAutomation.avgCycleTime - withAutomation.avgCycleTime) /
            withoutAutomation.avgCycleTime) *
            100
        )
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-indigo-600" />
        Automation Impact on Cycle Time
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* With Automation */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">With Automation</span>
          </div>
          <div className="text-2xl font-bold text-indigo-900 mb-1">
            {withAutomation.avgCycleTime} days
          </div>
          <div className="text-xs text-indigo-700">{withAutomation.rfpsCount} RFPs</div>
        </div>

        {/* Without Automation */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Without Automation</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {withoutAutomation.avgCycleTime} days
          </div>
          <div className="text-xs text-gray-600">{withoutAutomation.rfpsCount} RFPs</div>
        </div>
      </div>

      {/* Improvement Metric */}
      {improvement > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Cycle Time Improvement</span>
          </div>
          <span className="text-lg font-bold text-green-900">{improvement}%</span>
        </div>
      )}

      {improvement === 0 && withAutomation.rfpsCount === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Not enough data to compare. Try expanding the date range.
          </p>
        </div>
      )}
    </div>
  );
}
