"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDemoContext } from "./demo-context";

export function DemoPlayer() {
  const { isDemoMode, currentStep } = useDemoContext();
  const router = useRouter();
  const lastExecutedStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDemoMode || !currentStep) {
      // Clear any highlights
      document.querySelectorAll(".demo-highlight").forEach((el) => {
        el.classList.remove("demo-highlight");
      });
      lastExecutedStepRef.current = null;
      return;
    }

    // Prevent re-executing the same step
    if (lastExecutedStepRef.current === currentStep.id) {
      return;
    }

    lastExecutedStepRef.current = currentStep.id;

    executeStep();
  }, [isDemoMode, currentStep]);

  const executeStep = async () => {
    if (!currentStep) return;

    const { action, targetSelector, route, text } = currentStep;

    // Clear previous highlights
    document.querySelectorAll(".demo-highlight").forEach((el) => {
      el.classList.remove("demo-highlight");
    });

    // NAVIGATE action
    if (action === "navigate" && route) {
      router.push(route);
      return;
    }

    // Wait a bit for DOM to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Find target element
    const targetElement = targetSelector ? document.querySelector(targetSelector) : null;

    if (!targetElement && targetSelector) {
      console.warn(`Demo step ${currentStep.id}: Target not found: ${targetSelector}`);
      return;
    }

    // HIGHLIGHT action
    if (action === "highlight" && targetElement) {
      targetElement.classList.add("demo-highlight");
    }

    // SCROLL INTO VIEW action
    if (action === "scrollIntoView" && targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add("demo-highlight");
    }

    // CLICK action
    if (action === "click" && targetElement && targetElement instanceof HTMLElement) {
      targetElement.classList.add("demo-highlight");
      await new Promise((resolve) => setTimeout(resolve, 500));
      targetElement.click();
    }

    // TYPE action
    if (action === "type" && targetElement && text && targetElement instanceof HTMLInputElement) {
      targetElement.focus();
      targetElement.value = "";
      
      // Type text character by character
      for (let i = 0; i < text.length; i++) {
        targetElement.value += text[i];
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  };

  return null; // This component doesn't render anything
}
