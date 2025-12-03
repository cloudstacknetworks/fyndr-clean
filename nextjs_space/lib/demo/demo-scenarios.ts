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

      // STEP 35: PORTFOLIO OVERVIEW
      {
        id: "buyer_navigate_portfolio",
        timeOffsetMs: 32000,
        targetSelector: "a[href='/dashboard/portfolio']",
        action: "click",
        text: "Let's explore the Portfolio Overview for cross-RFP insights...",
        role: "buyer",
        duration: 2000
      },
      {
        id: "buyer_portfolio_intro",
        timeOffsetMs: 34000,
        route: "/dashboard/portfolio",
        action: "navigate",
        text: "Portfolio Overview provides a high-level view of all RFPs in your pipeline with comprehensive analytics.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "buyer_portfolio_kpis",
        timeOffsetMs: 38000,
        targetSelector: "[data-demo='portfolio-kpis']",
        action: "highlight",
        text: "These KPI cards show total RFPs, active RFPs, awarded RFPs, total budget, and in-flight budget across your entire portfolio.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_stages",
        timeOffsetMs: 43000,
        targetSelector: "[data-demo='portfolio-stages']",
        action: "scrollIntoView",
        text: "The Stage Distribution shows how many RFPs are in each stage (Intake, Sourcing, Evaluation, Awarded) with budget breakdowns.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_risk",
        timeOffsetMs: 48000,
        targetSelector: "[data-demo='portfolio-risk-readiness']",
        action: "scrollIntoView",
        text: "Risk Bands classify RFPs by risk level (low/medium/high), while Readiness Distribution shows supplier preparation scores.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_suppliers",
        timeOffsetMs: 53000,
        targetSelector: "[data-demo='portfolio-top-suppliers']",
        action: "scrollIntoView",
        text: "Top Suppliers shows performance metrics across all RFPs: participation, wins, scores, readiness, and reliability indices.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_milestones",
        timeOffsetMs: 58000,
        targetSelector: "[data-demo='portfolio-milestones']",
        action: "scrollIntoView",
        text: "Upcoming Milestones highlights critical dates across all RFPs in the next 30 days (Q&A closes, submission deadlines, awards).",
        role: "buyer",
        duration: 5000
      },

      // STEP 44: PORTFOLIO INSIGHTS DASHBOARD
      {
        id: "buyer_navigate_portfolio_insights",
        timeOffsetMs: 63000,
        targetSelector: "a[href='/dashboard/portfolio/insights']",
        action: "click",
        text: "Now let's explore the Portfolio Insights Dashboard for comprehensive analytics...",
        role: "buyer",
        duration: 3000
      },
      {
        id: "buyer_portfolio_insights_intro",
        timeOffsetMs: 66000,
        route: "/dashboard/portfolio/insights",
        action: "scrollIntoView",
        text: "Portfolio Insights Dashboard provides deep analytics across all RFPs: budget metrics, cycle times, scoring distribution, and supplier participation.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_budget",
        timeOffsetMs: 71000,
        action: "scrollIntoView",
        text: "Budget Metrics show total portfolio value, average and median budgets, and identify highest/lowest budget RFPs for strategic planning.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_cycle_time",
        timeOffsetMs: 76000,
        action: "scrollIntoView",
        text: "Cycle Time Analysis reveals average, median, shortest, and longest RFP durations to optimize future procurement timelines.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_scoring",
        timeOffsetMs: 81000,
        action: "scrollIntoView",
        text: "Score Distribution breaks down supplier performance across ranges (90-100, 80-89, etc.) with average scores and must-have compliance rates.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_suppliers",
        timeOffsetMs: 86000,
        action: "scrollIntoView",
        text: "Supplier Participation table ranks vendors by total RFPs, shortlisted count, awards, and declines—helping identify reliable partners.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_export",
        timeOffsetMs: 91000,
        targetSelector: "button:has-text('Export PDF')",
        action: "highlight",
        text: "Export PDF generates a branded, comprehensive report—perfect for executive presentations and strategic reviews.",
        role: "buyer",
        duration: 5000
      },

      // TRANSITION TO SUPPLIER PERSPECTIVE
      {
        id: "transition_to_supplier",
        timeOffsetMs: 96000,
        route: "/supplier",
        action: "navigate",
        text: "Now let's switch to the Supplier Portal to see how vendors experience FYNDR...",
        role: "supplier",
        duration: 3000
      },

      // SUPPLIER PERSPECTIVE - Dashboard
      {
        id: "supplier_dashboard_intro",
        timeOffsetMs: 99000,
        text: "Welcome to the Supplier Portal! Suppliers see a clean, action-oriented dashboard with priority RFPs and deadlines.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_dashboard_actions",
        timeOffsetMs: 104000,
        targetSelector: "h2:has-text('Priority Actions')",
        action: "highlight",
        text: "Priority Actions highlight RFPs that need immediate attention, with clear 'Start Response' or 'Continue Response' buttons.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_navigate_rfp",
        timeOffsetMs: 109000,
        targetSelector: "a[href*='/supplier/rfps/']",
        action: "click",
        text: "Let's view an RFP details...",
        role: "supplier",
        duration: 2000
      },

      // SUPPLIER PERSPECTIVE - RFP Overview
      {
        id: "supplier_rfp_timeline",
        timeOffsetMs: 111000,
        text: "Suppliers see a simplified timeline showing invite date, Q&A window, submission deadline, demo window, and award date.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_rfp_progress",
        timeOffsetMs: 116000,
        targetSelector: "h3:has-text('Submission Progress')",
        action: "highlight",
        text: "The Submission Progress Tracker shows a checklist of required sections: Executive Summary, Requirements, Pricing, Attachments, etc.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_rfp_quick_actions",
        timeOffsetMs: 88000,
        targetSelector: "h3:has-text('Quick Actions')",
        action: "highlight",
        text: "Quick Actions provide one-click access to start/continue response, ask questions, or download documents.",
        role: "supplier",
        duration: 5000
      },

      // RETURN TO BUYER PERSPECTIVE
      {
        id: "return_to_buyer",
        timeOffsetMs: 93000,
        route: "/dashboard",
        action: "navigate",
        text: "Back to the Buyer Dashboard to see how responses are evaluated...",
        role: "buyer",
        duration: 3000
      },

      // STEP 40: EXECUTIVE SUMMARY WORKSPACE
      {
        id: "buyer_navigate_to_executive_summary",
        timeOffsetMs: 96000,
        route: "/dashboard/rfps/[id]/executive-summary",
        action: "navigate",
        text: "Let's explore the Executive Summary Workspace where you can create stakeholder-specific reports...",
        role: "buyer",
        duration: 3000
      },
      {
        id: "buyer_executive_summary_intro",
        timeOffsetMs: 99000,
        targetSelector: "[data-demo='executive-summary-workspace']",
        action: "highlight",
        text: "The Executive Summary Workspace allows you to create, edit, and manage multiple versions of summaries tailored for different audiences.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_versions",
        timeOffsetMs: 104000,
        targetSelector: "[data-demo='version-list']",
        action: "highlight",
        text: "Version control tracks all drafts and official summaries, showing who created them and when they were last updated.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_editor",
        timeOffsetMs: 109000,
        targetSelector: "[data-demo='editor-container']",
        action: "highlight",
        text: "The rich text editor supports formatting, tables, lists, and inline images for professional stakeholder presentations.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_ai_generate",
        timeOffsetMs: 114000,
        targetSelector: "[data-demo='ai-generate-button']",
        action: "highlight",
        text: "AI-powered generation creates customized summaries based on audience (Executive, Board, Technical, Finance) and tone preferences.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_export",
        timeOffsetMs: 119000,
        targetSelector: "[data-demo='export-actions']",
        action: "highlight",
        text: "Export options include PDF, Word, and PowerPoint formats for easy sharing with stakeholders and board presentations.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_compare_panel",
        timeOffsetMs: 124000,
        targetSelector: "[data-demo='compare-versions-panel']",
        action: "highlight",
        text: "Compare Versions allows you to select any two summary versions and generate an AI-powered semantic diff showing what changed and why it matters.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_compare_button",
        timeOffsetMs: 129000,
        targetSelector: "[data-demo='compare-button']",
        action: "highlight",
        text: "The comparison engine uses AI to detect strengthened/weakened arguments, risk shifts, and strategic changes—going beyond simple text diffs.",
        role: "buyer",
        duration: 5000
      },

      // STEP 41: AWARD FINALIZATION
      {
        id: "buyer_award_finalization",
        timeOffsetMs: 134000,
        route: "/dashboard/rfps/[primaryRfpId]/award",
        action: "navigate",
        text: "Now we finalize the Award Recommendation. FYNDR records who won, why, and key risks—without performing any post-award procurement tasks.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_header",
        timeOffsetMs: 139000,
        targetSelector: "[data-demo='award-header']",
        action: "highlight",
        text: "The Award page shows the recommended supplier, decision rationale, scoring summary, and risk assessment in one comprehensive view.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_decision_brief",
        timeOffsetMs: 144000,
        targetSelector: "[data-demo='award-decision-brief']",
        action: "scrollIntoView",
        text: "The Decision Brief summarizes key drivers for the award decision and identifies primary risks with mitigation strategies.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_scoring_summary",
        timeOffsetMs: 149000,
        targetSelector: "[data-demo='award-scoring-summary']",
        action: "scrollIntoView",
        text: "Scoring Matrix Summary ranks all suppliers by overall score, weighted score, and must-have compliance percentage.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_timeline",
        timeOffsetMs: 154000,
        targetSelector: "[data-demo='award-timeline']",
        action: "scrollIntoView",
        text: "Timeline Summary tracks the RFP from creation to award decision, showing target vs. actual award dates and elapsed days.",
        role: "buyer",
        duration: 5000
      },

      // STEP 43: SUPPLIER OUTCOMES DASHBOARD
      {
        id: "supplier_outcomes_overview",
        timeOffsetMs: 159000,
        route: "/dashboard/rfps/[primaryRfpId]/supplier-outcomes",
        action: "navigate",
        targetSelector: "[data-demo='supplier-outcomes-header']",
        text: "This dashboard shows how each supplier performed based on the scoring matrix and award decision.",
        role: "buyer",
        duration: 5000
      },

      // STEP 47: RFP ARCHIVE AND COMPLIANCE PACK
      {
        id: "archive_navigate",
        timeOffsetMs: 164000,
        route: "/dashboard/rfps/[primaryRfpId]/archive",
        action: "navigate",
        text: "After the award decision, you can archive the RFP to create a read-only compliance audit trail.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "archive_overview",
        timeOffsetMs: 169000,
        targetSelector: "[data-demo='archive-header']",
        text: "The Archive page generates a comprehensive compliance pack with all pre-award artifacts, timeline data, and supplier outcomes.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "archive_export",
        timeOffsetMs: 174000,
        text: "Export the compliance pack as PDF or Word for permanent record-keeping and audit purposes.",
        role: "buyer",
        duration: 5000
      },

      // STEP 48: GLOBAL SEARCH ENGINE
      {
        id: "global_search_intro",
        timeOffsetMs: 179000,
        targetSelector: "[data-demo='global-search-bar']",
        action: "highlight",
        text: "Use the Global Search Bar to instantly search across all your RFPs, suppliers, summaries, activities, clauses, and archived content.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "global_search_perform",
        timeOffsetMs: 184000,
        targetSelector: "[data-demo='global-search-bar'] input",
        action: "type",
        text: "cloud",
        role: "buyer",
        duration: 3000
      },
      {
        id: "global_search_results_preview",
        timeOffsetMs: 187000,
        targetSelector: "[data-demo='global-search-results']",
        action: "highlight",
        text: "View live preview results grouped by category: RFPs, Suppliers, Summaries, Activities, Clauses, and Archived RFPs.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "global_search_results_page",
        timeOffsetMs: 192000,
        route: "/dashboard/search?q=cloud",
        action: "navigate",
        text: "Click 'View all results' to see the full search results page with detailed information across all categories.",
        role: "buyer",
        duration: 5000
      },

      // BUYER PERSPECTIVE - Final Insights
      {
        id: "buyer_final_overview",
        timeOffsetMs: 197000,
        text: "FYNDR streamlines the entire RFP lifecycle for both buyers and suppliers with AI-powered insights, automated workflows, and comprehensive tracking.",
        role: "buyer",
        duration: 5000
      },

      // DEMO COMPLETE
      {
        id: "demo_complete",
        timeOffsetMs: 202000,
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
