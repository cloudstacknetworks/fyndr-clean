/**
 * Compliance Checking Utilities (STEP 20)
 * Provides helper functions for compliance analysis
 */

export interface ComplianceCertification {
  name: string;
  verified: boolean;
  source?: string;
}

export interface ComplianceSection {
  certifications?: string[];
  claims?: string[];
  verified?: boolean;
  gaps?: string[];
  standards?: string[];
  concerns?: string[];
  regions?: string[];
}

export interface ContractualRedFlag {
  flag: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
}

export interface ComplianceFindings {
  securityCompliance: ComplianceSection;
  dataLocality: ComplianceSection;
  privacyCompliance: ComplianceSection;
  accessibilityCompliance: ComplianceSection;
  regulatoryCompliance: ComplianceSection & { vertical?: string };
  contractualRedFlags: ContractualRedFlag[];
  overallComplianceScore: number;
  summary: string;
}

/**
 * Common compliance standards for reference
 */
export const COMPLIANCE_STANDARDS = {
  security: ['SOC2 Type I', 'SOC2 Type II', 'ISO27001', 'ISO27002', 'FedRAMP', 'PCI DSS'],
  privacy: ['GDPR', 'CCPA', 'PIPEDA', 'Privacy Shield'],
  accessibility: ['WCAG 2.0 AA', 'WCAG 2.1 AA', 'WCAG 2.2 AA', 'Section 508', 'ADA'],
  healthcare: ['HIPAA', 'HITECH', 'FDA 21 CFR Part 11'],
  finance: ['SOX', 'PCI DSS', 'GLBA', 'Basel III'],
  education: ['FERPA', 'COPPA'],
};

/**
 * Calculate an overall compliance score from findings
 */
export function calculateComplianceScore(findings: Partial<ComplianceFindings>): number {
  let totalScore = 0;
  let sectionsEvaluated = 0;

  // Security compliance (25 points)
  if (findings.securityCompliance) {
    const certCount = findings.securityCompliance.certifications?.length || 0;
    const gapCount = findings.securityCompliance.gaps?.length || 0;
    totalScore += Math.max(0, Math.min(25, certCount * 10 - gapCount * 5));
    sectionsEvaluated++;
  }

  // Privacy compliance (20 points)
  if (findings.privacyCompliance) {
    const standards = findings.privacyCompliance.standards?.length || 0;
    const gaps = findings.privacyCompliance.gaps?.length || 0;
    totalScore += Math.max(0, Math.min(20, standards * 8 - gaps * 4));
    sectionsEvaluated++;
  }

  // Data locality (15 points)
  if (findings.dataLocality) {
    const regions = findings.dataLocality.regions?.length || 0;
    const concerns = findings.dataLocality.concerns?.length || 0;
    totalScore += Math.max(0, Math.min(15, regions * 5 - concerns * 3));
    sectionsEvaluated++;
  }

  // Accessibility compliance (15 points)
  if (findings.accessibilityCompliance) {
    const standards = findings.accessibilityCompliance.standards?.length || 0;
    const gaps = findings.accessibilityCompliance.gaps?.length || 0;
    totalScore += Math.max(0, Math.min(15, standards * 7 - gaps * 4));
    sectionsEvaluated++;
  }

  // Regulatory compliance (15 points)
  if (findings.regulatoryCompliance) {
    const standards = findings.regulatoryCompliance.standards?.length || 0;
    const gaps = findings.regulatoryCompliance.gaps?.length || 0;
    totalScore += Math.max(0, Math.min(15, standards * 7 - gaps * 4));
    sectionsEvaluated++;
  }

  // Contractual red flags (10 points deduction)
  if (findings.contractualRedFlags) {
    const highFlags = findings.contractualRedFlags.filter((f) => f.severity === 'HIGH').length;
    const medFlags = findings.contractualRedFlags.filter((f) => f.severity === 'MEDIUM').length;
    totalScore -= highFlags * 5 + medFlags * 2;
  }

  // Normalize to 0-100 scale
  if (sectionsEvaluated === 0) return 0;
  
  const maxPossible = 90; // 25+20+15+15+15
  const normalized = Math.round((totalScore / maxPossible) * 100);
  
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Helper to identify common contractual red flags in text
 */
export function identifyContractualRedFlags(text: string): ContractualRedFlag[] {
  const flags: ContractualRedFlag[] = [];
  const lowerText = text.toLowerCase();

  const patterns: Array<{ keyword: string; flag: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }> = [
    { keyword: 'unlimited liability', flag: 'Unlimited liability clause', severity: 'HIGH' },
    { keyword: 'no liability cap', flag: 'No liability cap specified', severity: 'HIGH' },
    { keyword: 'auto-renew', flag: 'Auto-renewal clause', severity: 'MEDIUM' },
    { keyword: 'automatic renewal', flag: 'Automatic renewal clause', severity: 'MEDIUM' },
    { keyword: 'non-compete', flag: 'Non-compete restrictions', severity: 'MEDIUM' },
    { keyword: 'exclusivity', flag: 'Exclusivity requirements', severity: 'MEDIUM' },
    { keyword: 'data ownership', flag: 'Data ownership concerns', severity: 'HIGH' },
    { keyword: 'vendor lock-in', flag: 'Vendor lock-in risk', severity: 'MEDIUM' },
    { keyword: 'termination fee', flag: 'Early termination fees', severity: 'MEDIUM' },
    { keyword: 'penalty clause', flag: 'Penalty clauses present', severity: 'MEDIUM' },
  ];

  patterns.forEach((pattern) => {
    if (lowerText.includes(pattern.keyword)) {
      flags.push({
        flag: pattern.flag,
        severity: pattern.severity,
        source: 'Contract text analysis',
      });
    }
  });

  return flags;
}

/**
 * Helper to extract mentioned compliance certifications from text
 */
export function extractComplianceMentions(text: string): {
  security: string[];
  privacy: string[];
  accessibility: string[];
  regulatory: string[];
} {
  const lowerText = text.toLowerCase();
  
  return {
    security: COMPLIANCE_STANDARDS.security.filter((std) =>
      lowerText.includes(std.toLowerCase())
    ),
    privacy: COMPLIANCE_STANDARDS.privacy.filter((std) =>
      lowerText.includes(std.toLowerCase())
    ),
    accessibility: COMPLIANCE_STANDARDS.accessibility.filter((std) =>
      lowerText.includes(std.toLowerCase())
    ),
    regulatory: [
      ...COMPLIANCE_STANDARDS.healthcare,
      ...COMPLIANCE_STANDARDS.finance,
      ...COMPLIANCE_STANDARDS.education,
    ].filter((std) => lowerText.includes(std.toLowerCase())),
  };
}
