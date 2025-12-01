"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEMO_SCENARIOS, DemoScenarioConfig, DemoStep } from "@/lib/demo/demo-scenarios";

interface DemoContextType {
  isDemoMode: boolean;
  isPlaying: boolean;
  scenarioId: string | null;
  currentStepIndex: number;
  currentStep: DemoStep | null;
  mode: "cinematic" | "guided" | null;

  startDemo: (scenarioId: string, mode: "cinematic" | "guided") => void;
  stopDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  pauseDemo: () => void;
  resumeDemo: () => void;
  jumpToStep: (stepIndex: number) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoContext must be used within DemoProvider");
  }
  return context;
}

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mode, setMode] = useState<"cinematic" | "guided" | null>(null);

  const currentScenario = scenarioId ? DEMO_SCENARIOS[scenarioId] : null;
  const currentStep = currentScenario?.steps[currentStepIndex] || null;

  const startDemo = (newScenarioId: string, newMode: "cinematic" | "guided") => {
    const scenario = DEMO_SCENARIOS[newScenarioId];
    if (!scenario) {
      console.error(`Scenario not found: ${newScenarioId}`);
      return;
    }

    setIsDemoMode(true);
    setScenarioId(newScenarioId);
    setMode(newMode);
    setCurrentStepIndex(0);
    setIsPlaying(newMode === "cinematic");
  };

  const stopDemo = () => {
    setIsDemoMode(false);
    setIsPlaying(false);
    setScenarioId(null);
    setMode(null);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    if (!currentScenario) return;
    
    if (currentStepIndex < currentScenario.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Demo complete
      if (mode === "guided") {
        // In guided mode, just stop at the end
        setIsPlaying(false);
      } else {
        // In cinematic mode, stop the demo
        stopDemo();
      }
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const pauseDemo = () => {
    setIsPlaying(false);
  };

  const resumeDemo = () => {
    setIsPlaying(true);
  };

  const jumpToStep = (stepIndex: number) => {
    if (!currentScenario) return;
    
    if (stepIndex >= 0 && stepIndex < currentScenario.steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  };

  // Auto-advance in cinematic mode
  useEffect(() => {
    if (!isDemoMode || !isPlaying || !currentStep || mode !== "cinematic") {
      return;
    }

    const duration = currentStep.duration || 3000;
    const timer = setTimeout(() => {
      nextStep();
    }, duration);

    return () => clearTimeout(timer);
  }, [isDemoMode, isPlaying, currentStepIndex, currentStep, mode]);

  const value: DemoContextType = {
    isDemoMode,
    isPlaying,
    scenarioId,
    currentStepIndex,
    currentStep,
    mode,
    startDemo,
    stopDemo,
    nextStep,
    prevStep,
    pauseDemo,
    resumeDemo,
    jumpToStep
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
