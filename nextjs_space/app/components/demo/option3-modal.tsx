"use client";

import { X, Check, Zap } from "lucide-react";

interface Option3ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Option3Modal({ isOpen, onClose }: Option3ModalProps) {
  if (!isOpen) return null;

  const baselineFeatures = [
    "Basic RFP creation and management",
    "Supplier invitation system",
    "Simple response collection",
    "Manual evaluation process",
    "Basic timeline tracking",
    "Email notifications",
    "Document upload/download"
  ];

  const upgradeFeatures = [
    { name: "AI-Powered Opportunity Scoring", isNew: true },
    { name: "Automated RFP Stage Management with SLA tracking", isNew: true },
    { name: "Smart Supplier Performance Scorecards", isNew: true },
    { name: "AI Response Extraction & Analysis", isNew: true },
    { name: "Intelligent Comparison Engine", isNew: true },
    { name: "Supplier Readiness AI Agent", isNew: true },
    { name: "Q&A Dialogue System with broadcast messaging", isNew: true },
    { name: "Comprehensive Activity Logging & Audit Trail", isNew: true },
    { name: "Advanced Notification Engine with preferences", isNew: true },
    { name: "Interactive Demo Mode (this feature!)", isNew: true }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">FYNDR Feature Overview</h2>
            <p className="text-blue-100 mt-1">Baseline vs. AI-Powered Upgrade</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Baseline Column */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ✓ Baseline Features
                </h3>
                <p className="text-sm text-gray-600">
                  Core RFP management capabilities that form the foundation of FYNDR.
                </p>
              </div>

              <div className="space-y-2">
                {baselineFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade Column */}
            <div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  AI-Powered Upgrade Features
                </h3>
                <p className="text-sm text-blue-700">
                  Advanced AI capabilities that transform RFP management into an intelligent, automated process.
                </p>
              </div>

              <div className="space-y-2">
                {upgradeFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                  >
                    <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-900 font-medium">{feature.name}</span>
                      {feature.isNew && (
                        <span className="ml-2 inline-block px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 text-center">
            <h4 className="text-xl font-bold mb-2">
              Experience the Full Power of FYNDR
            </h4>
            <p className="text-blue-100 mb-4">
              All features demonstrated in this cinematic demo are part of the AI-Powered Upgrade.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Continue Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
