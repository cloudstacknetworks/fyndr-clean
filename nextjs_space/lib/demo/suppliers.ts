export function generateFakeSupplierPerformance(supplierId: string) {
  return {
    totalRFPsParticipated: Math.floor(Math.random() * 20) + 5,
    totalWins: Math.floor(Math.random() * 5) + 1,
    totalLosses: Math.floor(Math.random() * 10) + 2,
    avgScore: Math.random() * 30 + 70,
    avgReadiness: Math.random() * 20 + 75,
    avgSubmissionSpeedDays: Math.random() * 10 + 5,
    avgPricingCompetitiveness: Math.random() * 20 + 70,
    reliabilityIndex: Math.random() * 20 + 75
  };
}

export function generateFakeKPIs() {
  const rfpsInvited = Math.floor(Math.random() * 20) + 10;
  const rfpsResponded = Math.floor(Math.random() * rfpsInvited) + 5;
  const rfpsWon = Math.floor(Math.random() * rfpsResponded * 0.3);

  return {
    participation: {
      rfpsInvited,
      rfpsResponded,
      rfpsSubmittedOnTime: Math.floor(rfpsResponded * 0.8),
      rfpsWon,
      winRate: (rfpsWon / rfpsResponded) * 100
    },
    readiness: {
      avgReadiness: Math.random() * 20 + 75,
      requirementsCoverage: Math.random() * 20 + 75,
      complianceAlignment: Math.random() * 20 + 70,
      riskFlagCount: Math.floor(Math.random() * 5)
    },
    pricing: {
      competitivenessIndex: Math.random() * 20 + 70,
      deviationVsAverage: (Math.random() - 0.5) * 20,
      pricingStability: Math.random() * 20 + 75
    },
    speed: {
      avgSubmissionSpeedDays: Math.random() * 10 + 5,
      fastestSubmission: Math.random() * 3 + 2,
      slowestSubmission: Math.random() * 10 + 15
    },
    quality: {
      responseCompleteness: Math.random() * 20 + 75,
      attachmentQuality: Math.random() * 20 + 70,
      aiQualityRating: Math.random() * 20 + 75
    },
    reliabilityIndex: Math.random() * 20 + 75
  };
}

export function generateFakeTrends(count: number = 5) {
  return Array.from({ length: count }, (_, i) => ({
    rfpId: `demo-rfp-${i}`,
    rfpTitle: `Demo RFP ${i + 1}`,
    finalScore: Math.random() * 30 + 70,
    submittedAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
    pricingScore: Math.random() * 30 + 70,
    readinessScore: Math.random() * 30 + 70,
    riskFlags: Math.floor(Math.random() * 3)
  }));
}

export function generateFakeBenchmarks() {
  return {
    scoreComparison: {
      supplier: Math.random() * 20 + 75,
      peers: Math.random() * 20 + 70,
      difference: (Math.random() - 0.5) * 10,
      percentile: Math.random() * 40 + 50
    },
    speedComparison: {
      supplier: Math.random() * 10 + 5,
      peers: Math.random() * 10 + 7,
      difference: (Math.random() - 0.5) * 5,
      percentile: Math.random() * 40 + 40
    },
    pricingComparison: {
      supplier: Math.random() * 20 + 70,
      peers: Math.random() * 20 + 72,
      difference: (Math.random() - 0.5) * 10,
      percentile: Math.random() * 40 + 45
    }
  };
}

export function generateFakeAISummary() {
  const templates = [
    "This supplier demonstrates strong technical readiness and consistent on-time submissions, though pricing tends to be 6–12% higher than the median competitor. Historically, they are responsive and low-risk, making them a dependable option when cost sensitivity is moderate.",
    "Supplier shows excellent pricing competitiveness and fast response times, ranking in the top 25% for submission speed. However, readiness scores indicate occasional compliance gaps that should be addressed during contract negotiations.",
    "A reliable mid-tier supplier with consistent performance across multiple RFPs. Pricing is competitive but not the lowest, and readiness scores are solid. Best suited for projects where balance between cost and quality is prioritized.",
    "This supplier excels in technical capability and documentation quality, consistently scoring above peer averages. Pricing is premium but justified by superior readiness and low risk profile. Recommended for high-stakes projects."
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
