/**
 * Supplier Readiness Engine (STEP 20)
 * Classifies supplier readiness based on compliance, mandatories, risks, and quality signals
 */

export type ReadinessIndicator = 'READY' | 'CONDITIONAL' | 'NOT_READY';

export interface RiskFlag {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  source: string;
  impact?: string;
  mitigation?: string;
}

export interface MandatoryRequirementsStatus {
  unmetMandatoryCount: number;
  partiallyMetMandatoryCount: number;
  unmetMandatoryList: Array<{
    requirement: string;
    status: string;
    impact: string;
    notes?: string;
  }>;
  partiallyMetMandatoryList: Array<{
    requirement: string;
    status: string;
    impact: string;
    notes?: string;
  }>;
  overallMandatoryPass: boolean;
  summary: string;
}

export interface ComplianceFindings {
  overallComplianceScore: number;
  summary: string;
}

export interface ReadinessAnalysis {
  indicator: ReadinessIndicator;
  rationale: string;
  criticalIssues: string[];
  conditionalFactors: string[];
  strengths: string[];
  score: number; // 0-100 readiness score
}

/**
 * Classify supplier readiness based on all signals
 */
export function classifySupplierReadiness(params: {
  mandatoryStatus?: MandatoryRequirementsStatus | null;
  complianceFindings?: ComplianceFindings | null;
  riskFlags?: RiskFlag[] | null;
  extractedPricing?: any;
  extractedRequirementsCoverage?: any;
  extractedDemoSummary?: any;
}): ReadinessAnalysis {
  const {
    mandatoryStatus,
    complianceFindings,
    riskFlags,
    extractedPricing,
    extractedRequirementsCoverage,
    extractedDemoSummary,
  } = params;

  const criticalIssues: string[] = [];
  const conditionalFactors: string[] = [];
  const strengths: string[] = [];
  let readinessScore = 100;

  // 1. Check Mandatory Requirements (Critical)
  if (mandatoryStatus) {
    const unmetCount = mandatoryStatus.unmetMandatoryCount || 0;
    const partialCount = mandatoryStatus.partiallyMetMandatoryCount || 0;

    if (unmetCount >= 3) {
      criticalIssues.push(`${unmetCount} mandatory requirements unmet`);
      readinessScore -= 40;
    } else if (unmetCount > 0) {
      const criticalUnmet = mandatoryStatus.unmetMandatoryList?.filter(
        (req) => req.impact === 'HIGH' || req.impact === 'CRITICAL'
      );
      if (criticalUnmet && criticalUnmet.length > 0) {
        criticalIssues.push(
          `${criticalUnmet.length} critical mandatory requirement(s) unmet: ${criticalUnmet.map((r) => r.requirement).join(', ')}`
        );
        readinessScore -= 35;
      } else {
        conditionalFactors.push(`${unmetCount} non-critical mandatory requirement(s) unmet`);
        readinessScore -= 15;
      }
    }

    if (partialCount > 0) {
      conditionalFactors.push(`${partialCount} mandatory requirement(s) partially met`);
      readinessScore -= 5 * partialCount;
    }

    if (unmetCount === 0 && partialCount <= 1) {
      strengths.push('All mandatory requirements met or substantially met');
    }
  }

  // 2. Check Compliance (Important)
  if (complianceFindings) {
    const score = complianceFindings.overallComplianceScore || 0;

    if (score < 50) {
      criticalIssues.push(`Major compliance failures (score: ${score}/100)`);
      readinessScore -= 25;
    } else if (score < 70) {
      conditionalFactors.push(`Compliance gaps requiring clarification (score: ${score}/100)`);
      readinessScore -= 10;
    } else if (score >= 85) {
      strengths.push(`Strong compliance posture (score: ${score}/100)`);
    }
  }

  // 3. Check Risk Flags (Critical for HIGH severity)
  if (riskFlags && riskFlags.length > 0) {
    const highRisks = riskFlags.filter((r) => r.severity === 'HIGH');
    const mediumRisks = riskFlags.filter((r) => r.severity === 'MEDIUM');

    if (highRisks.length >= 3) {
      criticalIssues.push(
        `${highRisks.length} high-severity risks identified: ${highRisks.map((r) => r.category).join(', ')}`
      );
      readinessScore -= 30;
    } else if (highRisks.length > 0) {
      conditionalFactors.push(
        `${highRisks.length} high-severity risk(s): ${highRisks.map((r) => r.category).join(', ')}`
      );
      readinessScore -= 12 * highRisks.length;
    }

    if (mediumRisks.length > 3) {
      conditionalFactors.push(`${mediumRisks.length} medium-severity risks identified`);
      readinessScore -= 8;
    }

    if (riskFlags.length === 0 || (highRisks.length === 0 && mediumRisks.length <= 2)) {
      strengths.push('Low risk profile');
    }
  }

  // 4. Check Pricing Quality (Conditional)
  if (extractedPricing) {
    const hiddenFees = extractedPricing.hiddenFeeAlerts || [];
    const criticalHiddenFees = hiddenFees.filter(
      (fee: any) => fee.severity === 'HIGH' || fee.severity === 'CRITICAL'
    );

    if (criticalHiddenFees.length > 0) {
      conditionalFactors.push(
        `Critical hidden fees identified: ${criticalHiddenFees.map((f: any) => f.description).join(', ')}`
      );
      readinessScore -= 8;
    } else if (hiddenFees.length === 0) {
      strengths.push('Clear pricing with no hidden fees');
    }
  }

  // 5. Check Requirements Coverage (Conditional)
  if (extractedRequirementsCoverage) {
    const requirements = extractedRequirementsCoverage.requirements || [];
    const doesNotMeet = requirements.filter(
      (req: any) => req.status === 'Does Not Meet'
    ).length;
    const partiallyMeets = requirements.filter(
      (req: any) => req.status === 'Partially Meets'
    ).length;

    if (doesNotMeet > 5) {
      conditionalFactors.push(`${doesNotMeet} requirements not met`);
      readinessScore -= 10;
    } else if (doesNotMeet === 0 && partiallyMeets <= 2) {
      strengths.push('Comprehensive requirements coverage');
    }
  }

  // 6. Check Demo Quality (Bonus)
  if (extractedDemoSummary) {
    const demoQuality = extractedDemoSummary.overallQualityRating;
    if (demoQuality === 'Excellent' || demoQuality === 'Good') {
      strengths.push(`${demoQuality} demo quality`);
    }
  }

  // Determine Readiness Indicator
  readinessScore = Math.max(0, Math.min(100, readinessScore));
  
  let indicator: ReadinessIndicator;
  let rationale: string;

  if (criticalIssues.length >= 3 || readinessScore < 50) {
    indicator = 'NOT_READY';
    rationale = `Supplier is not ready for selection. Critical issues: ${criticalIssues.join('; ')}`;
  } else if (criticalIssues.length > 0 || conditionalFactors.length >= 2 || readinessScore < 70) {
    indicator = 'CONDITIONAL';
    const issues = [...criticalIssues, ...conditionalFactors].slice(0, 3).join('; ');
    rationale = `Supplier readiness is conditional. Issues to address: ${issues}`;
    if (strengths.length > 0) {
      rationale += `. Strengths: ${strengths.slice(0, 2).join(', ')}`;
    }
  } else {
    indicator = 'READY';
    const strengthsList = strengths.length > 0 ? strengths.join(', ') : 'No major concerns identified';
    rationale = `Supplier is ready for selection. ${strengthsList}.`;
    if (conditionalFactors.length > 0) {
      rationale += ` Minor considerations: ${conditionalFactors.slice(0, 2).join(', ')}`;
    }
  }

  return {
    indicator,
    rationale,
    criticalIssues,
    conditionalFactors,
    strengths,
    score: readinessScore,
  };
}

/**
 * Get styling information for readiness indicator
 */
export function getReadinessStyles(indicator: ReadinessIndicator): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: string;
} {
  switch (indicator) {
    case 'READY':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        label: 'Ready',
      };
    case 'CONDITIONAL':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300',
        label: 'Conditional',
      };
    case 'NOT_READY':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        label: 'Not Ready',
      };
  }
}
