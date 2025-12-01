"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDemoContext } from "./demo-context";

export function DemoInitializer() {
  const searchParams = useSearchParams();
  const { startDemo, isDemoMode } = useDemoContext();

  useEffect(() => {
    // Only check URL params on mount and if not already in demo mode
    if (isDemoMode) return;

    const demoParam = searchParams.get("demo");
    const scenarioParam = searchParams.get("scenario");
    const modeParam = searchParams.get("mode") as "cinematic" | "guided" | null;

    // Check if demo should auto-start from URL
    if (demoParam === "true" || demoParam === "1") {
      const scenario = scenarioParam || "fyndr_full_flow";
      const mode = modeParam || "cinematic";
      
      // Small delay to ensure page is loaded
      setTimeout(() => {
        startDemo(scenario, mode);
      }, 500);
    }
  }, []); // Empty deps to run only once on mount

  return null;
}
