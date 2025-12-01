/**
 * STEP 34: Option 3 Upgrade Indicator Component
 * 
 * Displays a modal explaining the differences between Option 2 (current baseline)
 * and Option 3 (advanced AI-powered features).
 */

'use client';

import { useState } from 'react';
import { HelpCircle, X, Check, Sparkles, Zap } from 'lucide-react';

export function Option3Indicator() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Learn about Option 3 features"
      >
        <Sparkles className="w-4 h-4" />
        <span>Option 3 upgrade available</span>
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Decision Brief Features</h2>
                <p className="text-indigo-100 text-sm mt-1">Understanding Option 2 vs. Option 3</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Section 1: What Exists Now (Option 2 Baseline) */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <h3 className="text-lg font-semibold text-gray-900">What You Have Now (Option 2 Baseline)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Executive Decision Brief</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Comprehensive RFP decision summary with supplier comparisons, risk analysis, and recommendations.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <h4 className="font-semibold text-gray-900">AI Summary Generation</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      GPT-4o-mini powered executive summary with key insights and recommendations.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Supplier Snapshot Grid</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Side-by-side comparison of supplier scores, readiness, pricing, speed, and risk levels.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Risk Summary & Timeline</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Aggregated risk analysis with mitigation actions and upcoming RFP milestones.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <h4 className="font-semibold text-gray-900">PDF Export</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      One-click export to printable PDF format for executive presentations and board meetings.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Cinematic Demo Engine</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Auto-walkthrough capability showcasing the decision brief workflow for stakeholder demos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Option 3 Upgrades (Not Implemented) */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Option 3: AI-Powered Upgrade Features</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                    NOT IMPLEMENTED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Persona-Specific Variants</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Separate decision briefs tailored for CIO, Procurement, Finance, and Legal stakeholders with role-specific insights.
                    </p>
                  </div>

                  <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Multi-RFP Portfolio Briefs</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Consolidated decision brief across multiple RFPs for portfolio management and strategic planning.
                    </p>
                  </div>

                  <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Scheduled Stakeholder Digests</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Automated email delivery of decision briefs to stakeholder groups on a weekly/monthly cadence.
                    </p>
                  </div>

                  <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Multi-Language Support</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Automatically translate decision briefs into multiple languages for global stakeholder distribution.
                    </p>
                  </div>

                  <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Advanced AI Reasoning</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Deeper AI analysis using GPT-4 for scenario modeling, what-if analysis, and strategic recommendations.
                    </p>
                  </div>

                  <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Interactive Walkthroughs</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      Enhanced cinematic demo engine with interactive decision points and customizable presentation flows.
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Interested in Option 3 features?
                </h4>
                <p className="text-sm text-gray-700 mb-4">
                  Contact your account representative to learn more about upgrading to the full AI-powered
                  decision intelligence platform.
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    Contact Sales
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
