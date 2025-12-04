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
      // BUYER PERSPECTIVE - Home Dashboard (STEP 50)
      {
        id: "buyer_home_dashboard_intro",
        timeOffsetMs: 0,
        route: "/dashboard/home",
        action: "navigate",
        text: "Welcome to FYNDR! This is the Home Dashboard - your personalized command center for RFP management.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_home_stats_tiles",
        timeOffsetMs: 5000,
        targetSelector: "div.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4",
        action: "highlight",
        text: "Quick stats show Active RFPs, upcoming deadlines, evaluations in progress, and recent awards.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_home_work_queue",
        timeOffsetMs: 10000,
        targetSelector: "section:has(h2:has-text('Work Queue'))",
        action: "highlight",
        text: "The Work Queue prioritizes RFPs by urgency - critical, high, medium, or low - based on deadlines.",
        role: "buyer",
        duration: 5000
      },
      
      // BUYER PERSPECTIVE - Email Digest (STEP 52)
      {
        id: "buyer_email_digest_button",
        timeOffsetMs: 15000,
        targetSelector: "button:has-text('Generate Email Digest')",
        action: "highlight",
        text: "Generate personalized email digests to get a comprehensive summary of your RFP activity - weekly or monthly.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_email_digest_timeframe",
        timeOffsetMs: 20000,
        targetSelector: "select",
        action: "highlight",
        text: "Choose between Weekly or Monthly digest timeframes based on your reporting needs.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "buyer_email_digest_generate",
        timeOffsetMs: 24000,
        targetSelector: "button:has-text('Generate Email Digest')",
        action: "click",
        text: "Clicking this generates a professional HTML email digest with stats, awards, submissions, and action items.",
        role: "buyer",
        duration: 6000
      },

      // BUYER PERSPECTIVE - Timeline Automation (STEP 55)
      {
        id: "buyer_timeline_automation_box",
        timeOffsetMs: 30000,
        targetSelector: "div:has(h3:has-text('Timeline Automation Engine'))",
        action: "highlight",
        text: "Timeline Automation Engine: Auto-advances RFP stages based on dates and generates smart reminders for buyers and suppliers.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_timeline_automation_run",
        timeOffsetMs: 35000,
        targetSelector: "button:has-text('Run Timeline Automation')",
        action: "highlight",
        text: "Run automation to auto-advance phases (7 rules), generate buyer reminders (9 types), and supplier reminders (6 types)!",
        role: "buyer",
        duration: 5000
      },

      // BUYER PERSPECTIVE - Dashboard
      {
        id: "buyer_dashboard_intro",
        timeOffsetMs: 40000,
        route: "/dashboard",
        action: "navigate",
        text: "Now let's check the Analytics Dashboard for deeper insights into your RFP pipeline.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "buyer_dashboard_pipeline",
        timeOffsetMs: 34000,
        targetSelector: "[data-demo-widget='pipeline']",
        action: "highlight",
        text: "The Pipeline Widget shows all active RFPs across 9 stages, from Intake to Archived.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "buyer_navigate_rfps",
        timeOffsetMs: 38000,
        targetSelector: "a[href='/dashboard/rfps']",
        action: "click",
        text: "Let's view all RFPs...",
        role: "buyer",
        duration: 2000
      },

      // BUYER PERSPECTIVE - RFP List
      {
        id: "buyer_rfp_list",
        timeOffsetMs: 40000,
        targetSelector: "tbody tr:first-child",
        action: "highlight",
        text: "Here's our primary RFP: Unified Communications & Contact Center RFP for 2025. This is a high-priority project with 4 suppliers competing.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_click_primary_rfp",
        timeOffsetMs: 45000,
        targetSelector: "tbody tr:first-child a",
        action: "click",
        text: "Let's dive into the details...",
        role: "buyer",
        duration: 2000
      },

      // BUYER PERSPECTIVE - RFP Detail
      {
        id: "buyer_rfp_detail_timeline",
        timeOffsetMs: 32000,
        targetSelector: "h2:has-text('RFP Timeline')",
        action: "scrollIntoView",
        text: "The RFP Timeline shows all key dates: Q&A window, submission deadline, demo sessions, and award date.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_rfp_detail_suppliers",
        timeOffsetMs: 37000,
        targetSelector: "h2:has-text('Supplier Contacts')",
        action: "scrollIntoView",
        text: "Supplier Contacts panel tracks each supplier's invitation status and readiness in real-time.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_rfp_detail_responses",
        timeOffsetMs: 57000,
        targetSelector: "h2:has-text('Supplier Responses')",
        action: "scrollIntoView",
        text: "The Supplier Responses section shows submission status and readiness indicators for all participating suppliers.",
        role: "buyer",
        duration: 5000
      },

      // STEP 35: PORTFOLIO OVERVIEW
      {
        id: "buyer_navigate_portfolio",
        timeOffsetMs: 47000,
        targetSelector: "a[href='/dashboard/portfolio']",
        action: "click",
        text: "Let's explore the Portfolio Overview for cross-RFP insights...",
        role: "buyer",
        duration: 2000
      },
      {
        id: "buyer_portfolio_intro",
        timeOffsetMs: 49000,
        route: "/dashboard/portfolio",
        action: "navigate",
        text: "Portfolio Overview provides a high-level view of all RFPs in your pipeline with comprehensive analytics.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "buyer_portfolio_kpis",
        timeOffsetMs: 53000,
        targetSelector: "[data-demo='portfolio-kpis']",
        action: "highlight",
        text: "These KPI cards show total RFPs, active RFPs, awarded RFPs, total budget, and in-flight budget across your entire portfolio.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_stages",
        timeOffsetMs: 58000,
        targetSelector: "[data-demo='portfolio-stages']",
        action: "scrollIntoView",
        text: "The Stage Distribution shows how many RFPs are in each stage (Intake, Sourcing, Evaluation, Awarded) with budget breakdowns.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_risk",
        timeOffsetMs: 63000,
        targetSelector: "[data-demo='portfolio-risk-readiness']",
        action: "scrollIntoView",
        text: "Risk Bands classify RFPs by risk level (low/medium/high), while Readiness Distribution shows supplier preparation scores.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_suppliers",
        timeOffsetMs: 68000,
        targetSelector: "[data-demo='portfolio-top-suppliers']",
        action: "scrollIntoView",
        text: "Top Suppliers shows performance metrics across all RFPs: participation, wins, scores, readiness, and reliability indices.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_milestones",
        timeOffsetMs: 73000,
        targetSelector: "[data-demo='portfolio-milestones']",
        action: "scrollIntoView",
        text: "Upcoming Milestones highlights critical dates across all RFPs in the next 30 days (Q&A closes, submission deadlines, awards).",
        role: "buyer",
        duration: 5000
      },

      // STEP 49: MULTI-RFP COMPARISON WORKSPACE
      {
        id: "buyer_multi_rfp_comparison_intro",
        timeOffsetMs: 78000,
        targetSelector: "button:has-text('Compare RFPs')",
        action: "highlight",
        text: "The Multi-RFP Comparison feature allows you to compare 2-5 RFPs side-by-side for strategic portfolio analysis.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_multi_rfp_comparison_open_selector",
        timeOffsetMs: 83000,
        targetSelector: "button:has-text('Compare RFPs')",
        action: "click",
        text: "Let's open the comparison selector...",
        role: "buyer",
        duration: 2000
      },
      {
        id: "buyer_multi_rfp_comparison_selector",
        timeOffsetMs: 85000,
        targetSelector: "[data-demo='multi-rfp-comparison']",
        action: "highlight",
        text: "Select 2-5 RFPs from your active pipeline. The comparison workspace will analyze cycle times, budgets, supplier participation, and generate cross-RFP insights.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_multi_rfp_comparison_select_rfps",
        timeOffsetMs: 90000,
        text: "Check the RFPs you want to compare. The system validates your selection (2-5 RFPs, same company, pre-award only).",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_multi_rfp_comparison_workspace",
        timeOffsetMs: 95000,
        route: "/dashboard/rfps/compare-multi",
        action: "navigate",
        text: "The Multi-RFP Comparison Workspace displays a comprehensive side-by-side analysis with 6 sections: overview table, snapshot availability, cycle time chart, supplier participation map, and algorithmic insights.",
        role: "buyer",
        duration: 6000
      },
      {
        id: "buyer_multi_rfp_comparison_export",
        timeOffsetMs: 101000,
        targetSelector: "button:has-text('Export PDF')",
        action: "highlight",
        text: "Export the comparison report as PDF or Word for sharing with stakeholders and strategic planning meetings.",
        role: "buyer",
        duration: 5000
      },

      // STEP 44: PORTFOLIO INSIGHTS DASHBOARD
      {
        id: "buyer_navigate_portfolio_insights",
        timeOffsetMs: 106000,
        targetSelector: "a[href='/dashboard/portfolio/insights']",
        action: "click",
        text: "Now let's explore the Portfolio Insights Dashboard for comprehensive analytics...",
        role: "buyer",
        duration: 3000
      },
      {
        id: "buyer_portfolio_insights_intro",
        timeOffsetMs: 109000,
        route: "/dashboard/portfolio/insights",
        action: "scrollIntoView",
        text: "Portfolio Insights Dashboard provides deep analytics across all RFPs: budget metrics, cycle times, scoring distribution, and supplier participation.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_budget",
        timeOffsetMs: 86000,
        action: "scrollIntoView",
        text: "Budget Metrics show total portfolio value, average and median budgets, and identify highest/lowest budget RFPs for strategic planning.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_cycle_time",
        timeOffsetMs: 91000,
        action: "scrollIntoView",
        text: "Cycle Time Analysis reveals average, median, shortest, and longest RFP durations to optimize future procurement timelines.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_scoring",
        timeOffsetMs: 96000,
        action: "scrollIntoView",
        text: "Score Distribution breaks down supplier performance across ranges (90-100, 80-89, etc.) with average scores and must-have compliance rates.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_suppliers",
        timeOffsetMs: 101000,
        action: "scrollIntoView",
        text: "Supplier Participation table ranks vendors by total RFPs, shortlisted count, awards, and declines—helping identify reliable partners.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_portfolio_insights_export",
        timeOffsetMs: 106000,
        targetSelector: "button:has-text('Export PDF')",
        action: "highlight",
        text: "Export PDF generates a branded, comprehensive report—perfect for executive presentations and strategic reviews.",
        role: "buyer",
        duration: 5000
      },

      // TRANSITION TO SUPPLIER PERSPECTIVE
      {
        id: "transition_to_supplier",
        timeOffsetMs: 111000,
        route: "/supplier",
        action: "navigate",
        text: "Now let's switch to the Supplier Portal to see how vendors experience FYNDR...",
        role: "supplier",
        duration: 3000
      },

      // SUPPLIER PERSPECTIVE - Dashboard
      {
        id: "supplier_dashboard_intro",
        timeOffsetMs: 114000,
        text: "Welcome to the Supplier Portal! Suppliers see a clean, action-oriented dashboard with priority RFPs and deadlines.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_dashboard_actions",
        timeOffsetMs: 119000,
        targetSelector: "h2:has-text('Priority Actions')",
        action: "highlight",
        text: "Priority Actions highlight RFPs that need immediate attention, with clear 'Start Response' or 'Continue Response' buttons.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_navigate_rfp",
        timeOffsetMs: 124000,
        targetSelector: "a[href*='/supplier/rfps/']",
        action: "click",
        text: "Let's view an RFP details...",
        role: "supplier",
        duration: 2000
      },

      // SUPPLIER PERSPECTIVE - RFP Overview
      {
        id: "supplier_rfp_timeline",
        timeOffsetMs: 126000,
        text: "Suppliers see a simplified timeline showing invite date, Q&A window, submission deadline, demo window, and award date.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_rfp_progress",
        timeOffsetMs: 131000,
        targetSelector: "h3:has-text('Submission Progress')",
        action: "highlight",
        text: "The Submission Progress Tracker shows a checklist of required sections: Executive Summary, Requirements, Pricing, Attachments, etc.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_rfp_quick_actions",
        timeOffsetMs: 103000,
        targetSelector: "h3:has-text('Quick Actions')",
        action: "highlight",
        text: "Quick Actions provide one-click access to start/continue response, ask questions, or download documents.",
        role: "supplier",
        duration: 5000
      },

      // RETURN TO BUYER PERSPECTIVE
      {
        id: "return_to_buyer",
        timeOffsetMs: 108000,
        route: "/dashboard",
        action: "navigate",
        text: "Back to the Buyer Dashboard to see how responses are evaluated...",
        role: "buyer",
        duration: 3000
      },

      // STEP 40: EXECUTIVE SUMMARY WORKSPACE
      {
        id: "buyer_navigate_to_executive_summary",
        timeOffsetMs: 111000,
        route: "/dashboard/rfps/[id]/executive-summary",
        action: "navigate",
        text: "Let's explore the Executive Summary Workspace where you can create stakeholder-specific reports...",
        role: "buyer",
        duration: 3000
      },
      {
        id: "buyer_executive_summary_intro",
        timeOffsetMs: 114000,
        targetSelector: "[data-demo='executive-summary-workspace']",
        action: "highlight",
        text: "The Executive Summary Workspace allows you to create, edit, and manage multiple versions of summaries tailored for different audiences.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_versions",
        timeOffsetMs: 119000,
        targetSelector: "[data-demo='version-list']",
        action: "highlight",
        text: "Version control tracks all drafts and official summaries, showing who created them and when they were last updated.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_editor",
        timeOffsetMs: 124000,
        targetSelector: "[data-demo='editor-container']",
        action: "highlight",
        text: "The rich text editor supports formatting, tables, lists, and inline images for professional stakeholder presentations.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_ai_generate",
        timeOffsetMs: 129000,
        targetSelector: "[data-demo='ai-generate-button']",
        action: "highlight",
        text: "AI-powered generation creates customized summaries based on audience (Executive, Board, Technical, Finance) and tone preferences.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_export",
        timeOffsetMs: 134000,
        targetSelector: "[data-demo='export-actions']",
        action: "highlight",
        text: "Export options include PDF, Word, and PowerPoint formats for easy sharing with stakeholders and board presentations.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_compare_panel",
        timeOffsetMs: 139000,
        targetSelector: "[data-demo='compare-versions-panel']",
        action: "highlight",
        text: "Compare Versions allows you to select any two summary versions and generate an AI-powered semantic diff showing what changed and why it matters.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_executive_summary_compare_button",
        timeOffsetMs: 144000,
        targetSelector: "[data-demo='compare-button']",
        action: "highlight",
        text: "The comparison engine uses AI to detect strengthened/weakened arguments, risk shifts, and strategic changes—going beyond simple text diffs.",
        role: "buyer",
        duration: 5000
      },

      // STEP 41: AWARD FINALIZATION
      {
        id: "buyer_award_finalization",
        timeOffsetMs: 149000,
        route: "/dashboard/rfps/[primaryRfpId]/award",
        action: "navigate",
        text: "Now we finalize the Award Recommendation. FYNDR records who won, why, and key risks—without performing any post-award procurement tasks.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_header",
        timeOffsetMs: 154000,
        targetSelector: "[data-demo='award-header']",
        action: "highlight",
        text: "The Award page shows the recommended supplier, decision rationale, scoring summary, and risk assessment in one comprehensive view.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_decision_brief",
        timeOffsetMs: 159000,
        targetSelector: "[data-demo='award-decision-brief']",
        action: "scrollIntoView",
        text: "The Decision Brief summarizes key drivers for the award decision and identifies primary risks with mitigation strategies.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_scoring_summary",
        timeOffsetMs: 164000,
        targetSelector: "[data-demo='award-scoring-summary']",
        action: "scrollIntoView",
        text: "Scoring Matrix Summary ranks all suppliers by overall score, weighted score, and must-have compliance percentage.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "buyer_award_timeline",
        timeOffsetMs: 169000,
        targetSelector: "[data-demo='award-timeline']",
        action: "scrollIntoView",
        text: "Timeline Summary tracks the RFP from creation to award decision, showing target vs. actual award dates and elapsed days.",
        role: "buyer",
        duration: 5000
      },

      // STEP 43: SUPPLIER OUTCOMES DASHBOARD
      {
        id: "supplier_outcomes_overview",
        timeOffsetMs: 174000,
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
        timeOffsetMs: 179000,
        route: "/dashboard/rfps/[primaryRfpId]/archive",
        action: "navigate",
        text: "After the award decision, you can archive the RFP to create a read-only compliance audit trail.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "archive_overview",
        timeOffsetMs: 184000,
        targetSelector: "[data-demo='archive-header']",
        text: "The Archive page generates a comprehensive compliance pack with all pre-award artifacts, timeline data, and supplier outcomes.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "archive_export",
        timeOffsetMs: 189000,
        text: "Export the compliance pack as PDF or Word for permanent record-keeping and audit purposes.",
        role: "buyer",
        duration: 5000
      },

      // STEP 48: GLOBAL SEARCH ENGINE
      {
        id: "global_search_intro",
        timeOffsetMs: 194000,
        targetSelector: "[data-demo='global-search-bar']",
        action: "highlight",
        text: "Use the Global Search Bar to instantly search across all your RFPs, suppliers, summaries, activities, clauses, and archived content.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "global_search_perform",
        timeOffsetMs: 199000,
        targetSelector: "[data-demo='global-search-bar'] input",
        action: "type",
        text: "cloud",
        role: "buyer",
        duration: 3000
      },
      {
        id: "global_search_results_preview",
        timeOffsetMs: 202000,
        targetSelector: "[data-demo='global-search-results']",
        action: "highlight",
        text: "View live preview results grouped by category: RFPs, Suppliers, Summaries, Activities, Clauses, and Archived RFPs.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "global_search_results_page",
        timeOffsetMs: 207000,
        route: "/dashboard/search?q=cloud",
        action: "navigate",
        text: "Click 'View all results' to see the full search results page with detailed information across all categories.",
        role: "buyer",
        duration: 5000
      },

      // STEP 51: GLOBAL NOTIFICATIONS CENTER
      {
        id: "notifications_center_intro",
        timeOffsetMs: 212000,
        route: "/dashboard/notifications",
        action: "navigate",
        text: "The Notifications Center provides a read-only, centralized view of all recent activity across your RFPs - executive summaries, awards, scoring, compliance, and portfolio insights.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "notifications_category_filters",
        timeOffsetMs: 217000,
        targetSelector: "div.flex.flex-wrap.gap-2",
        action: "highlight",
        text: "Filter notifications by category: All, Executive Summaries, Awards, Scoring, Compliance, and Portfolio. Each notification links directly to the relevant RFP for quick access.",
        role: "buyer",
        duration: 5000
      },

      // BUYER PERSPECTIVE - Final Insights
      {
        id: "buyer_final_overview",
        timeOffsetMs: 222000,
        text: "FYNDR streamlines the entire RFP lifecycle for both buyers and suppliers with AI-powered insights, automated workflows, and comprehensive tracking.",
        role: "buyer",
        duration: 5000
      },

      // DEMO COMPLETE
      {
        id: "demo_complete",
        timeOffsetMs: 227000,
        text: "Demo complete! FYNDR manages everything from RFP creation to supplier selection. Thank you for watching!",
        role: "buyer",
        duration: 5000
      }
    ]
  },

  // STEP 53: Admin Settings Demo
  admin_settings: {
    id: "admin_settings",
    name: "Admin Settings Tour",
    description: "Explore company, user, and preference settings",
    steps: [
      {
        id: "settings_nav",
        timeOffsetMs: 0,
        route: "/dashboard/settings",
        action: "navigate",
        text: "Welcome to the Admin Settings panel - manage your company, team, and preferences here.",
        role: "buyer",
        duration: 4000
      },
      {
        id: "company_settings_tab",
        timeOffsetMs: 4000,
        targetSelector: "[data-demo='settings-company']",
        action: "highlight",
        text: "Company Settings: Update your company profile, logo, brand color, timezone, and fiscal year start month.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "user_management_tab",
        timeOffsetMs: 9000,
        targetSelector: "[data-demo='settings-users']",
        action: "highlight",
        text: "User Management: Invite team members, change roles, and manage user access across your organization.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "preferences_tab",
        timeOffsetMs: 14000,
        targetSelector: "[data-demo='settings-preferences']",
        action: "highlight",
        text: "Preferences & Defaults: Set your default RFP priority, stage, timezone, and workflow preferences to streamline RFP creation.",
        role: "buyer",
        duration: 5000
      }
    ]
  },

  // STEP 56: Template Library Demo
  template_library_flow: {
    id: "template_library_flow",
    name: "RFP Template Library Tour",
    description: "Demonstration of company-level template management and versioning",
    steps: [
      {
        id: "template_library_intro",
        timeOffsetMs: 0,
        route: "/dashboard/templates",
        action: "navigate",
        text: "Welcome to the RFP Template Library! Create and manage standardized RFP templates across your organization.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_library_toolbar",
        timeOffsetMs: 5000,
        targetSelector: "[data-demo='template-toolbar']",
        action: "highlight",
        text: "Search for templates, apply filters by category or visibility, and create new templates from scratch.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_library_grid",
        timeOffsetMs: 10000,
        targetSelector: "[data-demo='templates-grid']",
        action: "highlight",
        text: "Company templates are visible to all team members, while private templates are only visible to you.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_card",
        timeOffsetMs: 15000,
        targetSelector: "[data-demo='template-card']",
        action: "highlight",
        text: "Each template card shows its name, category, visibility, version count, and quick actions.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_actions",
        timeOffsetMs: 20000,
        targetSelector: "[data-demo='template-actions']",
        action: "highlight",
        text: "View, duplicate, or delete templates. Duplicating a template creates a private copy you can customize.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_editor_intro",
        timeOffsetMs: 25000,
        route: "/dashboard/templates/[id]",
        action: "navigate",
        text: "The Template Editor lets you update template metadata and content. Changes are automatically versioned.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_basic_info",
        timeOffsetMs: 30000,
        targetSelector: "[data-demo='template-basic-info']",
        action: "highlight",
        text: "Edit the template name, description, visibility, and category. Set visibility to Company or Private.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_content",
        timeOffsetMs: 35000,
        targetSelector: "[data-demo='template-content']",
        action: "highlight",
        text: "The content editor uses JSON to define template structure - sections, questions, and default values.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_version_history",
        timeOffsetMs: 40000,
        targetSelector: "[data-demo='template-versions']",
        action: "highlight",
        text: "Version History tracks all changes to the template. Each save creates a new version with author and timestamp.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_metadata",
        timeOffsetMs: 45000,
        targetSelector: "[data-demo='template-metadata']",
        action: "highlight",
        text: "View template metadata including creator, creation date, and last updated date.",
        role: "buyer",
        duration: 5000
      },
      {
        id: "template_complete",
        timeOffsetMs: 50000,
        text: "Templates standardize your RFP process and can be reused across multiple RFPs. Create templates for your most common RFP types!",
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
        route: "/dashboard/supplier/home",
        action: "navigate",
        text: "Welcome to the FYNDR Supplier Portal! Your Work Inbox is your central hub for managing all RFP activities.",
        role: "supplier",
        duration: 4000
      },
      {
        id: "supplier_inbox_header",
        timeOffsetMs: 4000,
        targetSelector: "[data-demo='supplier-inbox-header']",
        text: "The Work Inbox consolidates all your pending actions, deadlines, invitations, and buyer activity in one place.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_pending_actions",
        timeOffsetMs: 9000,
        targetSelector: "[data-demo='supplier-inbox-actions']",
        text: "Pending Actions shows what needs your immediate attention - proposals to submit, questions to answer, or documents to upload.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_deadlines",
        timeOffsetMs: 14000,
        targetSelector: "[data-demo='supplier-inbox-deadlines']",
        text: "Upcoming Deadlines tracks all submission dates, Q&A windows, and demo schedules with urgency indicators.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_recent_activity",
        timeOffsetMs: 19000,
        targetSelector: "[data-demo='supplier-inbox-recent']",
        text: "Recent Activity From Buyer keeps you informed about award decisions, questions answered, and broadcast messages.",
        role: "supplier",
        duration: 5000
      },
      {
        id: "supplier_complete",
        timeOffsetMs: 24000,
        text: "Explore the supplier portal to manage your RFP responses efficiently!",
        role: "supplier",
        duration: 3000
      }
    ]
  }
};
