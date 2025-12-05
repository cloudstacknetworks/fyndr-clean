/**
 * STEP 63: Export Registry
 * Central definition of all available exports in the Fyndr system
 */

export interface ExportDefinition {
  id: string;
  title: string;
  description: string;
  exportType: "pdf" | "docx" | "json" | "csv" | "excel";
  endpoint: string;
  requiresRfpId: boolean;
  requiresSupplierId: boolean;
  requiresSummaryId?: boolean;
  requiresSupplierContactId?: boolean;
  category: "RFP" | "Evaluation" | "Scoring" | "Summary" | "Requirements" | "Activity Log" | "Compliance" | "Automation" | "System";
  enabled: boolean;
  queryParams?: string; // Optional query parameters to append
}

/**
 * Get all export definitions
 */
export function getExportRegistry(): ExportDefinition[] {
  return [
    // ============================================================
    // RFP EXPORTS
    // ============================================================
    {
      id: "rfp_list_export",
      title: "RFP List Export",
      description: "Export all RFPs with basic information (JSON)",
      exportType: "json",
      endpoint: "/api/dashboard/rfps/export",
      requiresRfpId: false,
      requiresSupplierId: false,
      category: "RFP",
      enabled: true
    },
    {
      id: "rfp_compliance_pack_pdf",
      title: "Compliance Pack (PDF)",
      description: "Export complete compliance pack including all requirements, scoring, and submission details",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/archive/compliance-pack.pdf",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Compliance",
      enabled: true
    },
    {
      id: "rfp_compliance_pack_docx",
      title: "Compliance Pack (DOCX)",
      description: "Export complete compliance pack as editable Word document",
      exportType: "docx",
      endpoint: "/api/dashboard/rfps/[id]/archive/compliance-pack.docx",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Compliance",
      enabled: true
    },
    {
      id: "rfp_timeline_csv",
      title: "Timeline Export (CSV)",
      description: "Export RFP timeline with milestones and dates",
      exportType: "csv",
      endpoint: "/api/dashboard/rfps/[id]/timeline/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "RFP",
      enabled: true,
      queryParams: "format=csv"
    },
    {
      id: "rfp_timeline_excel",
      title: "Timeline Export (Excel)",
      description: "Export RFP timeline as Excel spreadsheet",
      exportType: "excel",
      endpoint: "/api/dashboard/rfps/[id]/timeline/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "RFP",
      enabled: true,
      queryParams: "format=excel"
    },
    {
      id: "rfp_timeline_pdf",
      title: "Timeline Export (PDF)",
      description: "Export RFP timeline as PDF document",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/timeline/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "RFP",
      enabled: true,
      queryParams: "format=pdf"
    },
    {
      id: "rfp_bundle_export",
      title: "RFP Bundle Package",
      description: "Export complete RFP bundle with all related documents",
      exportType: "json",
      endpoint: "/api/dashboard/rfps/[id]/bundle/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "RFP",
      enabled: true
    },
    {
      id: "rfp_suppliers_export",
      title: "Invited Suppliers List",
      description: "Export list of all invited suppliers with their details",
      exportType: "csv",
      endpoint: "/api/dashboard/rfps/[id]/suppliers/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "RFP",
      enabled: true
    },
    {
      id: "rfp_tasks_export",
      title: "RFP Tasks Export",
      description: "Export all tasks and action items for this RFP",
      exportType: "csv",
      endpoint: "/api/dashboard/rfps/[id]/tasks/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "RFP",
      enabled: true
    },

    // ============================================================
    // SCORING EXPORTS
    // ============================================================
    {
      id: "scoring_matrix_csv",
      title: "Scoring Matrix (CSV)",
      description: "Export requirement-level scoring matrix with all suppliers",
      exportType: "csv",
      endpoint: "/api/dashboard/rfps/[id]/comparison/matrix/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Scoring",
      enabled: true
    },
    {
      id: "comparison_export",
      title: "Supplier Comparison",
      description: "Export comprehensive supplier comparison data",
      exportType: "json",
      endpoint: "/api/dashboard/rfps/[id]/comparison/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Scoring",
      enabled: true
    },

    // ============================================================
    // EVALUATION EXPORTS
    // ============================================================
    {
      id: "evaluation_pdf",
      title: "Supplier Evaluation (PDF)",
      description: "Export detailed evaluation for a specific supplier",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/evaluation/[supplierId]/export/pdf",
      requiresRfpId: true,
      requiresSupplierId: true,
      category: "Evaluation",
      enabled: true
    },
    {
      id: "evaluation_docx",
      title: "Supplier Evaluation (DOCX)",
      description: "Export detailed evaluation for a specific supplier as Word document",
      exportType: "docx",
      endpoint: "/api/dashboard/rfps/[id]/evaluation/[supplierId]/export/docx",
      requiresRfpId: true,
      requiresSupplierId: true,
      category: "Evaluation",
      enabled: true
    },
    {
      id: "supplier_response_export",
      title: "Supplier Response Export",
      description: "Export individual supplier's response to RFP",
      exportType: "json",
      endpoint: "/api/dashboard/rfps/[id]/responses/[supplierContactId]/export",
      requiresRfpId: true,
      requiresSupplierContactId: true,
      requiresSupplierId: false,
      category: "Evaluation",
      enabled: true
    },

    // ============================================================
    // SUMMARY EXPORTS
    // ============================================================
    {
      id: "executive_summary_pdf",
      title: "Executive Summary (PDF)",
      description: "Export AI-generated executive summary for a supplier",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/executive-summaries/[summaryId]/pdf",
      requiresRfpId: true,
      requiresSupplierId: false,
      requiresSummaryId: true,
      category: "Summary",
      enabled: true
    },
    {
      id: "executive_summary_docx",
      title: "Executive Summary (DOCX)",
      description: "Export AI-generated executive summary as Word document",
      exportType: "docx",
      endpoint: "/api/dashboard/rfps/[id]/executive-summaries/[summaryId]/docx",
      requiresRfpId: true,
      requiresSupplierId: false,
      requiresSummaryId: true,
      category: "Summary",
      enabled: true
    },
    {
      id: "executive_summaries_compare_pdf",
      title: "Compare Summaries (PDF)",
      description: "Export comparison of multiple executive summaries",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/executive-summaries/compare/pdf",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },
    {
      id: "executive_summaries_compare_docx",
      title: "Compare Summaries (DOCX)",
      description: "Export comparison of multiple executive summaries as Word document",
      exportType: "docx",
      endpoint: "/api/dashboard/rfps/[id]/executive-summaries/compare/docx",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },
    {
      id: "decision_brief_pdf",
      title: "Decision Brief (PDF)",
      description: "Export final decision brief with recommendations",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/decision-brief/pdf",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },
    {
      id: "award_summary_pdf",
      title: "Award Summary (PDF)",
      description: "Export award decision summary",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/award/pdf",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },
    {
      id: "award_summary_docx",
      title: "Award Summary (DOCX)",
      description: "Export award decision summary as Word document",
      exportType: "docx",
      endpoint: "/api/dashboard/rfps/[id]/award/docx",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },
    {
      id: "supplier_debrief_pdf",
      title: "Supplier Debrief (PDF)",
      description: "Export detailed debrief for a specific supplier",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/supplier-debrief/[supplierId]/pdf",
      requiresRfpId: true,
      requiresSupplierId: true,
      category: "Summary",
      enabled: true
    },
    {
      id: "supplier_debrief_docx",
      title: "Supplier Debrief (DOCX)",
      description: "Export detailed debrief for a specific supplier as Word document",
      exportType: "docx",
      endpoint: "/api/dashboard/rfps/[id]/supplier-debrief/[supplierId]/docx",
      requiresRfpId: true,
      requiresSupplierId: true,
      category: "Summary",
      enabled: true
    },
    {
      id: "supplier_outcomes_pdf",
      title: "All Supplier Outcomes (PDF)",
      description: "Export outcomes for all suppliers in this RFP",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/[id]/supplier-outcomes/pdf",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },
    {
      id: "multi_rfp_compare_pdf",
      title: "Multi-RFP Comparison (PDF)",
      description: "Export comparison across multiple RFPs",
      exportType: "pdf",
      endpoint: "/api/dashboard/rfps/compare-multi/export-pdf",
      requiresRfpId: false,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },
    {
      id: "multi_rfp_compare_docx",
      title: "Multi-RFP Comparison (DOCX)",
      description: "Export comparison across multiple RFPs as Word document",
      exportType: "docx",
      endpoint: "/api/dashboard/rfps/compare-multi/export-docx",
      requiresRfpId: false,
      requiresSupplierId: false,
      category: "Summary",
      enabled: true
    },

    // ============================================================
    // ACTIVITY LOG EXPORTS
    // ============================================================
    {
      id: "activity_log_csv",
      title: "Activity Log (CSV)",
      description: "Export complete activity log for an RFP",
      exportType: "csv",
      endpoint: "/api/dashboard/rfps/[id]/activity/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Activity Log",
      enabled: true
    },

    // ============================================================
    // REQUIREMENTS & Q&A EXPORTS
    // ============================================================
    {
      id: "qa_export",
      title: "Q&A Export",
      description: "Export all questions and answers for this RFP",
      exportType: "csv",
      endpoint: "/api/dashboard/rfps/[id]/qa/export",
      requiresRfpId: true,
      requiresSupplierId: false,
      category: "Requirements",
      enabled: true
    },

    // ============================================================
    // SYSTEM EXPORTS
    // ============================================================
    {
      id: "supplier_scorecard_export",
      title: "Supplier Scorecard",
      description: "Export overall scorecard for a supplier across all RFPs",
      exportType: "json",
      endpoint: "/api/dashboard/suppliers/[id]/scorecard/export",
      requiresRfpId: false,
      requiresSupplierId: true,
      category: "System",
      enabled: true
    },
    {
      id: "portfolio_insights_pdf",
      title: "Portfolio Insights (PDF)",
      description: "Export portfolio-level insights and analytics",
      exportType: "pdf",
      endpoint: "/api/dashboard/portfolio/insights/pdf",
      requiresRfpId: false,
      requiresSupplierId: false,
      category: "System",
      enabled: true
    },
    {
      id: "dashboard_widgets_export",
      title: "Dashboard Widgets Data",
      description: "Export current dashboard widget data",
      exportType: "json",
      endpoint: "/api/dashboard/widgets/exports",
      requiresRfpId: false,
      requiresSupplierId: false,
      category: "System",
      enabled: true
    }
  ];
}

/**
 * Get export definition by ID
 */
export function getExportById(id: string): ExportDefinition | undefined {
  return getExportRegistry().find(exp => exp.id === id);
}

/**
 * Get exports by category
 */
export function getExportsByCategory(category: string): ExportDefinition[] {
  return getExportRegistry().filter(exp => exp.category === category && exp.enabled);
}

/**
 * Get all enabled exports
 */
export function getEnabledExports(): ExportDefinition[] {
  return getExportRegistry().filter(exp => exp.enabled);
}

/**
 * Get exports that don't require an RFP ID
 */
export function getSystemExports(): ExportDefinition[] {
  return getExportRegistry().filter(exp => !exp.requiresRfpId && exp.enabled);
}

/**
 * Get exports that require an RFP ID
 */
export function getRfpExports(): ExportDefinition[] {
  return getExportRegistry().filter(exp => exp.requiresRfpId && exp.enabled);
}
