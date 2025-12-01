"use client";

import { useDemoContext } from "./demo-context";
import { DEMO_SCENARIOS } from "@/lib/demo/demo-scenarios";
import { 
  Play, 
  Pause, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
  Monitor, 
  User 
} from "lucide-react";

export function DemoOverlay() {
  const {
    isDemoMode,
    isPlaying,
    scenarioId,
    currentStepIndex,
    currentStep,
    mode,
    stopDemo,
    nextStep,
    prevStep,
    pauseDemo,
    resumeDemo
  } = useDemoContext();

  if (!isDemoMode || !scenarioId || !currentStep) {
    return null;
  }

  const scenario = DEMO_SCENARIOS[scenarioId];
  const totalSteps = scenario.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <>
      {/* Semi-transparent overlay backdrop */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-40" />

      {/* Demo control bar - top */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-50 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {currentStep.role === "buyer" ? (
                <Monitor className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {currentStep.role === "buyer" ? "Buyer View" : "Supplier View"}
              </span>
            </div>
            <div className="h-6 w-px bg-white/30" />
            <span className="text-sm opacity-90">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {mode === "guided" && (
              <>
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextStep}
                  disabled={currentStepIndex >= totalSteps - 1}
                  className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next Step"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {mode === "cinematic" && (
              <button
                onClick={isPlaying ? pauseDemo : resumeDemo}
                className="p-2 rounded hover:bg-white/10 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={stopDemo}
              className="p-2 rounded hover:bg-white/10 transition-colors"
              title="Stop Demo"
            >
              <Square className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Demo narration box - bottom center */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-3xl w-full px-4">
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-6 border border-gray-700">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {currentStepIndex + 1}
            </div>
            <div className="flex-1">
              <p className="text-lg leading-relaxed">{currentStep.text}</p>
              {mode === "guided" && (
                <div className="mt-4 flex items-center gap-3 text-sm text-gray-300">
                  <span>Use arrow buttons above to navigate</span>
                  <span>•</span>
                  <span>Press X to exit</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for demo highlights */}
      <style jsx global>{`
        .demo-highlight {
          position: relative;
          animation: demo-pulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5),
                      0 0 20px rgba(59, 130, 246, 0.3);
          border-radius: 4px;
          z-index: 35;
        }

        @keyframes demo-pulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5),
                        0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.8),
                        0 0 30px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </>
  );
}
