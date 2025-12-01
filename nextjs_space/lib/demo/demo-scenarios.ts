export interface DemoStep {
  id: string;
  timeOffsetMs: number;
  targetSelector?: string;
  action?: "highlight" | "click" | "scrollIntoView" | "type" | "navigate";
  text?: string;
  role?: "buyer" | "supplier";
  route?: string;
  duration?: number; // How long to show this step (ms)
}

export interface DemoScenarioConfig {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
}

export const DEMO_SCENARIOS: Record<string, DemoScenarioConfig> = {
  fyndr_full_flow: {
    id: "fyndr_full_flow",
    name: "FYNDR Full Flow Demo",
    description: "Complete end-to-end demonstration of FYNDR RFP Management System from buyer and supplier perspectives",
    steps: [
      // BUYER PERSPECTIVE - Dashboard
      {
        id: "buyer_dashboard_intro",
        timeOffsetMs: 0,
        route: "/dashboard",
        action: "navigate",
        text: "Welcome to FYNDR! This is the Buyer Dashboard where procurement teams manage their RFP lifecycle.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "buyer_dashboard_pipeline",
        timeOffsetMs: 4000,
        targetSelector: "[data-demo-widget='pipeline']",
        action: "highlight",
        text: "The Pipeline Widget shows all active RFPs across 9 stages, from Intake to Archived.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "buyer_navigate_rfps",
        timeOffsetMs: 8000,
        targetSelector: "a[href='/dashboard/rfps']",
        action: "click",
        text: "Let's view all RFPs...",
        role: "buyer",
        duration: 2000
      },

      // BUYER PERSPECTIVE - RFP List
      {
        id: "buyer_rfp_list",
        timeOffsetMs: 10000,
        targetSelector: "tbody tr:first-child",
        action: "highlight",
        text: "Here's our primary RFP: Unified Communications & Contact Center RFP for 2025. This is a high-priority project with 4 suppliers competing.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_click_primary_rfp",
        timeOffsetMs: 15000,
        targetSelector: "tbody tr:first-child a",
        action: "click",
        text: "Let's dive into the details...",
        role: "buyer",
        duration: 2000
      },

      // BUYER PERSPECTIVE - RFP Detail
      {
        id: "buyer_rfp_detail_timeline",
        timeOffsetMs: 17000,
        targetSelector: "h2:has-text('RFP Timeline')",
        action: "scrollIntoView",
        text: "The RFP Timeline shows all key dates: Q&A window, submission deadline, demo sessions, and award date.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_rfp_detail_suppliers",
        timeOffsetMs: 22000,
        targetSelector: "h2:has-text('Supplier Contacts')",
        action: "scrollIntoView",
        text: "Supplier Contacts panel tracks each supplier's invitation status and readiness in real-time.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_rfp_detail_responses",
        timeOffsetMs: 27000,
        targetSelector: "h2:has-text('Supplier Responses')",
        action: "scrollIntoView",
        text: "The Supplier Responses section shows submission status and readiness indicators for all participating suppliers.",
        role: "buyer",
        duration: 5000
      },

      // TRANSITION TO SUPPLIER PERSPECTIVE
      {
        id: "transition_to_supplier",
        timeOffsetMs: 32000,
        route: "/supplier",
        action: "navigate",
        text: "Now let's switch to the Supplier Portal to see how vendors experience FYNDR...",
        role: "supplier",
        duration: 3000
      },

      // SUPPLIER PERSPECTIVE - Dashboard
      {
        id: "supplier_dashboard_intro",
        timeOffsetMs: 35000,
        text: "Welcome to the Supplier Portal! Suppliers see a clean, action-oriented dashboard with priority RFPs and deadlines.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_dashboard_actions",
        timeOffsetMs: 40000,
        targetSelector: "h2:has-text('Priority Actions')",
        action: "highlight",
        text: "Priority Actions highlight RFPs that need immediate attention, with clear 'Start Response' or 'Continue Response' buttons.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_navigate_rfp",
        timeOffsetMs: 45000,
        targetSelector: "a[href*='/supplier/rfps/']",
        action: "click",
        text: "Let's view an RFP details...",
        role: "supplier",
        duration: 2000
      },

      // SUPPLIER PERSPECTIVE - RFP Overview
      {
        id: "supplier_rfp_timeline",
        timeOffsetMs: 47000,
        text: "Suppliers see a simplified timeline showing invite date, Q&A window, submission deadline, demo window, and award date.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_rfp_progress",
        timeOffsetMs: 52000,
        targetSelector: "h3:has-text('Submission Progress')",
        action: "highlight",
        text: "The Submission Progress Tracker shows a checklist of required sections: Executive Summary, Requirements, Pricing, Attachments, etc.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_rfp_quick_actions",
        timeOffsetMs: 57000,
        targetSelector: "h3:has-text('Quick Actions')",
        action: "highlight",
        text: "Quick Actions provide one-click access to start/continue response, ask questions, or download documents.",
        role: "supplier",
        duration: 5000
      },

      // RETURN TO BUYER PERSPECTIVE
      {
        id: "return_to_buyer",
        timeOffsetMs: 62000,
        route: "/dashboard",
        action: "navigate",
        text: "Back to the Buyer Dashboard to see how responses are evaluated...",
        role: "buyer",
        duration: 3000
      },

      // BUYER PERSPECTIVE - Final Insights
      {
        id: "buyer_final_overview",
        timeOffsetMs: 65000,
        text: "FYNDR streamlines the entire RFP lifecycle for both buyers and suppliers with AI-powered insights, automated workflows, and comprehensive tracking.",
        role: "buyer",
        duration: 5000
      },

      // DEMO COMPLETE
      {
        id: "demo_complete",
        timeOffsetMs: 70000,
        text: "Demo complete! FYNDR manages everything from RFP creation to supplier selection. Thank you for watching!",
        role: "buyer",
        duration: 5000
      }
    ]
  },

  supplier_only_flow: {
    id: "supplier_only_flow",
    name: "Supplier Portal Tour",
    description: "Focused tour of supplier-facing features",
    steps: [
      {
        id: "supplier_intro",
        timeOffsetMs: 0,
        route: "/supplier",
        action: "navigate",
        text: "Welcome to the FYNDR Supplier Portal!",
        role: "supplier",
        duration: 3000
      },
      {
        id: "supplier_dashboard",
        timeOffsetMs: 3000,
        text: "Your dashboard shows all active RFPs, deadlines, and priority actions.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_complete",
        timeOffsetMs: 8000,
        text: "Explore the supplier portal to manage your RFP responses!",
        role: "supplier",
        duration: 3000
      }
    ]
  }
};
