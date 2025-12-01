import { prisma } from "@/lib/prisma";

export interface CategoryBreakdown {
  category: string;
  score: number;
  totalItems: number;
  completedItems: number;
  percentage: number;
  weight: number;
}

export interface ComplianceFlag {
  flagType: string;
  severity: "high" | "medium" | "low";
  message: string;
  requirement: string;
}

export interface MissingRequirement {
  requirement: string;
  category: string;
  severity: "critical" | "important" | "optional";
  suggestedFix: string;
}

export interface ReadinessBreakdown {
  categories: CategoryBreakdown[];
  overallScore: number;
  complianceFlags: ComplianceFlag[];
  missingRequirements: MissingRequirement[];
}

const CATEGORY_WEIGHTS = {
  functional: 0.25,
  technical: 0.25,
  compliance: 0.30,
  integration: 0.10,
  sla: 0.10
};

export async function calculateDetailedReadiness(
  responseId: string
): Promise<ReadinessBreakdown> {
  const response = await prisma.supplierResponse.findUnique({
    where: { id: responseId },
    include: {
      rfp: true,
      supplierContact: true,
      attachments: true
    }
  });

  if (!response) {
    throw new Error("Response not found");
  }

  const structuredData = response.structuredData as any || {};
  
  // Calculate category-by-category coverage
  const categories: CategoryBreakdown[] = [
    calculateFunctionalRequirements(structuredData),
    calculateTechnicalRequirements(structuredData),
    calculateIntegrationRequirements(structuredData),
    calculateComplianceRequirements(structuredData),
    calculateSLARequirements(structuredData),
    calculatePricingCompleteness(structuredData)
  ];

  // Calculate overall weighted score
  const overallScore = calculateWeightedScore(categories);

  // Generate compliance flags
  const complianceFlags = generateComplianceFlags(structuredData, response);

  // Generate missing requirements
  const missingRequirements = generateMissingRequirements(structuredData, categories);

  return {
    categories,
    overallScore,
    complianceFlags,
    missingRequirements
  };
}

function calculateFunctionalRequirements(data: any): CategoryBreakdown {
  const totalItems = 10;
  let completedItems = 0;

  if (data.executiveSummary) completedItems++;
  if (data.requirementsCoverage) completedItems += 3;
  if (data.features) completedItems += 2;
  if (data.capabilities) completedItems += 2;
  if (data.useCases) completedItems += 2;

  const percentage = (completedItems / totalItems) * 100;
  const score = Math.round(percentage);

  return {
    category: "Functional Requirements",
    score,
    totalItems,
    completedItems,
    percentage,
    weight: CATEGORY_WEIGHTS.functional
  };
}

function calculateTechnicalRequirements(data: any): CategoryBreakdown {
  const totalItems = 8;
  let completedItems = 0;

  if (data.architecture) completedItems += 2;
  if (data.infrastructure) completedItems += 2;
  if (data.scalability) completedItems++;
  if (data.performance) completedItems++;
  if (data.reliability) completedItems++;
  if (data.deployment) completedItems++;

  const percentage = (completedItems / totalItems) * 100;
  const score = Math.round(percentage);

  return {
    category: "Technical Requirements",
    score,
    totalItems,
    completedItems,
    percentage,
    weight: CATEGORY_WEIGHTS.technical
  };
}

function calculateIntegrationRequirements(data: any): CategoryBreakdown {
  const totalItems = 6;
  let completedItems = 0;

  if (data.integrations) completedItems += 2;
  if (data.apis) completedItems += 2;
  if (data.dataFormats) completedItems++;
  if (data.migrationPlan) completedItems++;

  const percentage = (completedItems / totalItems) * 100;
  const score = Math.round(percentage);

  return {
    category: "Integration Requirements",
    score,
    totalItems,
    completedItems,
    percentage,
    weight: CATEGORY_WEIGHTS.integration
  };
}

function calculateComplianceRequirements(data: any): CategoryBreakdown {
  const totalItems = 12;
  let completedItems = 0;

  if (data.security) completedItems += 3;
  if (data.compliance) completedItems += 3;
  if (data.certifications) completedItems += 2;
  if (data.dataPrivacy) completedItems += 2;
  if (data.auditTrails) completedItems++;
  if (data.disasterRecovery) completedItems++;

  const percentage = (completedItems / totalItems) * 100;
  const score = Math.round(percentage);

  return {
    category: "Compliance & Security",
    score,
    totalItems,
    completedItems,
    percentage,
    weight: CATEGORY_WEIGHTS.compliance
  };
}

function calculateSLARequirements(data: any): CategoryBreakdown {
  const totalItems = 6;
  let completedItems = 0;

  if (data.sla) completedItems += 2;
  if (data.support) completedItems += 2;
  if (data.uptime) completedItems++;
  if (data.responseTime) completedItems++;

  const percentage = (completedItems / totalItems) * 100;
  const score = Math.round(percentage);

  return {
    category: "Support & SLAs",
    score,
    totalItems,
    completedItems,
    percentage,
    weight: CATEGORY_WEIGHTS.sla
  };
}

function calculatePricingCompleteness(data: any): CategoryBreakdown {
  const totalItems = 5;
  let completedItems = 0;

  if (data.pricing) completedItems += 2;
  if (data.pricingModel) completedItems++;
  if (data.paymentTerms) completedItems++;
  if (data.discounts) completedItems++;

  const percentage = (completedItems / totalItems) * 100;
  const score = Math.round(percentage);

  return {
    category: "Pricing Structure",
    score,
    totalItems,
    completedItems,
    percentage,
    weight: 0 // Not weighted in overall score
  };
}

function calculateWeightedScore(categories: CategoryBreakdown[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const cat of categories) {
    if (cat.weight > 0) {
      weightedSum += cat.score * cat.weight;
      totalWeight += cat.weight;
    }
  }

  return Math.round(weightedSum / totalWeight);
}

function generateComplianceFlags(data: any, response: any): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];

  // Check for missing security certifications
  if (!data.certifications || !data.certifications.includes("SOC 2")) {
    flags.push({
      flagType: "Missing Certification",
      severity: "high",
      message: "SOC 2 Type II certification not provided",
      requirement: "Security Compliance"
    });
  }

  // Check for missing data privacy compliance
  if (!data.dataPrivacy || !data.dataPrivacy.includes("GDPR")) {
    flags.push({
      flagType: "Data Privacy",
      severity: "high",
      message: "GDPR compliance not documented",
      requirement: "Data Privacy & Protection"
    });
  }

  // Check for missing disaster recovery plan
  if (!data.disasterRecovery) {
    flags.push({
      flagType: "Business Continuity",
      severity: "medium",
      message: "Disaster recovery plan not provided",
      requirement: "Business Continuity"
    });
  }

  // Check for missing SLA commitments
  if (!data.sla || !data.uptime) {
    flags.push({
      flagType: "SLA Commitment",
      severity: "medium",
      message: "Uptime SLA not specified",
      requirement: "Service Level Agreement"
    });
  }

  // Check for incomplete pricing
  if (!data.pricing || !data.pricingModel) {
    flags.push({
      flagType: "Pricing Transparency",
      severity: "low",
      message: "Pricing model not fully detailed",
      requirement: "Pricing Structure"
    });
  }

  return flags;
}

function generateMissingRequirements(
  data: any,
  categories: CategoryBreakdown[]
): MissingRequirement[] {
  const missing: MissingRequirement[] = [];

  // Functional gaps
  if (!data.executiveSummary) {
    missing.push({
      requirement: "Executive Summary",
      category: "Functional Requirements",
      severity: "critical",
      suggestedFix: "Provide a 2-3 paragraph executive summary of your solution"
    });
  }

  if (!data.requirementsCoverage) {
    missing.push({
      requirement: "Requirements Coverage Matrix",
      category: "Functional Requirements",
      severity: "critical",
      suggestedFix: "Map each RFP requirement to your solution capabilities"
    });
  }

  // Technical gaps
  if (!data.architecture) {
    missing.push({
      requirement: "Solution Architecture",
      category: "Technical Requirements",
      severity: "important",
      suggestedFix: "Provide architecture diagrams and technical specifications"
    });
  }

  if (!data.scalability) {
    missing.push({
      requirement: "Scalability Plan",
      category: "Technical Requirements",
      severity: "important",
      suggestedFix: "Describe how your solution scales with user growth"
    });
  }

  // Compliance gaps
  if (!data.security) {
    missing.push({
      requirement: "Security Documentation",
      category: "Compliance & Security",
      severity: "critical",
      suggestedFix: "Provide security whitepaper and penetration test results"
    });
  }

  if (!data.certifications) {
    missing.push({
      requirement: "Compliance Certifications",
      category: "Compliance & Security",
      severity: "critical",
      suggestedFix: "Upload SOC 2, ISO 27001, and other relevant certifications"
    });
  }

  // Integration gaps
  if (!data.integrations) {
    missing.push({
      requirement: "Integration Capabilities",
      category: "Integration Requirements",
      severity: "important",
      suggestedFix: "List all supported integrations and APIs"
    });
  }

  // SLA gaps
  if (!data.sla) {
    missing.push({
      requirement: "Service Level Agreement",
      category: "Support & SLAs",
      severity: "important",
      suggestedFix: "Provide detailed SLA commitments with uptime guarantees"
    });
  }

  return missing;
}

export async function updateResponseReadiness(responseId: string): Promise<void> {
  const breakdown = await calculateDetailedReadiness(responseId);

  await prisma.supplierResponse.update({
    where: { id: responseId },
    data: {
      readinessScore: breakdown.overallScore,
      readinessBreakdown: breakdown.categories as any,
      complianceFlags: breakdown.complianceFlags as any,
      missingRequirements: breakdown.missingRequirements as any
    }
  });
}
