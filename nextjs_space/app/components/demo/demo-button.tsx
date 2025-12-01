"use client";

import { useState } from "react";
import { Video, Play } from "lucide-react";
import { useDemoContext } from "./demo-context";
import { Option3Modal } from "./option3-modal";

interface DemoButtonProps {
  variant?: "buyer" | "supplier";
}

export function DemoButton({ variant = "buyer" }: DemoButtonProps) {
  const { startDemo, isDemoMode } = useDemoContext();
  const [showModal, setShowModal] = useState(false);
  const [showOption3Modal, setShowOption3Modal] = useState(false);

  if (isDemoMode) {
    return null; // Hide button when demo is active
  }

  const handleStartDemo = (mode: "cinematic" | "guided") => {
    const scenarioId = variant === "buyer" ? "fyndr_full_flow" : "supplier_only_flow";
    setShowModal(false);
    startDemo(scenarioId, mode);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
      >
        <Video className="w-4 h-4" />
        <span className="font-medium">Watch Demo</span>
      </button>

      {/* Demo mode selection modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Choose Demo Mode
            </h3>

            <div className="space-y-4">
              {/* Cinematic Mode */}
              <button
                onClick={() => handleStartDemo("cinematic")}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Cinematic Mode</span>
                </div>
                <p className="text-sm text-gray-600">
                  Sit back and watch an automated tour with narrated steps. Perfect for first-time viewers.
                </p>
              </button>

              {/* Guided Mode */}
              <button
                onClick={() => handleStartDemo("guided")}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Guided Mode</span>
                </div>
                <p className="text-sm text-gray-600">
                  Step through the demo at your own pace using navigation controls.
                </p>
              </button>
            </div>

            {/* Option 3 Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowOption3Modal(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Baseline vs. Upgrade Features →
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Option 3 Modal */}
      <Option3Modal isOpen={showOption3Modal} onClose={() => setShowOption3Modal(false)} />
    </>
  );
}
