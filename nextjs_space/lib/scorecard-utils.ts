import { prisma } from "@/lib/prisma";

export interface SupplierKPIs {
  participation: {
    rfpsInvited: number;
    rfpsResponded: number;
    rfpsSubmittedOnTime: number;
    rfpsWon: number;
    winRate: number;
  };
  readiness: {
    avgReadiness: number;
    requirementsCoverage: number;
    complianceAlignment: number;
    riskFlagCount: number;
  };
  pricing: {
    competitivenessIndex: number;
    deviationVsAverage: number;
    pricingStability: number;
  };
  speed: {
    avgSubmissionSpeedDays: number;
    fastestSubmission: number;
    slowestSubmission: number;
  };
  quality: {
    responseCompleteness: number;
    attachmentQuality: number;
    aiQualityRating: number;
  };
  reliabilityIndex: number;
}

export async function calculateSupplierKPIs(supplierId: string): Promise<SupplierKPIs> {
  // Fetch all responses for this supplier
  const responses = await prisma.supplierResponse.findMany({
    where: { supplierContactId: supplierId },
    include: {
      rfp: true,
      attachments: true
    }
  });

  // Calculate participation metrics
  const rfpsInvited = responses.length;
  const rfpsResponded = responses.filter((r: any) => r.submittedAt).length;
  const rfpsSubmittedOnTime = responses.filter((r: any) => {
    if (!r.submittedAt || !r.rfp.submissionEnd) return false;
    return r.submittedAt <= r.rfp.submissionEnd;
  }).length;
  
  // For now, we don't have a "winner" field, so we'll use comparison scores above 80 as proxy
  const rfpsWon = responses.filter((r: any) => r.comparisonScore && r.comparisonScore >= 80).length;
  const winRate = rfpsResponded > 0 ? (rfpsWon / rfpsResponded) * 100 : 0;

  // Calculate readiness metrics
  const readinessScores = responses
    .map((r: any) => r.readinessScore)
    .filter((s: any) => s !== null) as number[];
  const avgReadiness = readinessScores.length > 0
    ? readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length
    : 0;

  const requirementsCoverage = responses.length > 0
    ? responses.filter((r: any) => r.requirementsCoverage && r.requirementsCoverage > 80).length / responses.length * 100
    : 0;

  const complianceAlignment = responses.length > 0
    ? responses.filter((r: any) => r.readinessIndicator === "READY").length / responses.length * 100
    : 0;

  const riskFlagCount = responses.reduce((sum: number, r: any) => {
    if (!r.riskFlags || !Array.isArray(r.riskFlags)) return sum;
    return sum + (r.riskFlags as any[]).length;
  }, 0);

  // Calculate pricing metrics
  const pricingScores = responses
    .map((r: any) => r.pricingScore)
    .filter((s: any) => s !== null) as number[];
  const competitivenessIndex = pricingScores.length > 0
    ? pricingScores.reduce((a, b) => a + b, 0) / pricingScores.length
    : 0;

  // Calculate deviation vs average (simplified - will improve later)
  const deviationVsAverage = 0;

  // Calculate pricing stability (variance)
  const pricingStability = pricingScores.length > 1
    ? calculateStability(pricingScores)
    : 100;

  // Calculate speed metrics
  const submissionSpeeds = responses
    .map((r: any) => r.submissionSpeedDays)
    .filter((s: any) => s !== null) as number[];
  const avgSubmissionSpeedDays = submissionSpeeds.length > 0
    ? submissionSpeeds.reduce((a, b) => a + b, 0) / submissionSpeeds.length
    : 0;
  const fastestSubmission = submissionSpeeds.length > 0 ? Math.min(...submissionSpeeds) : 0;
  const slowestSubmission = submissionSpeeds.length > 0 ? Math.max(...submissionSpeeds) : 0;

  // Calculate quality metrics
  const responseCompleteness = responses.length > 0
    ? responses.filter((r: any) => r.structuredAnswers && Object.keys(r.structuredAnswers as any).length > 5).length / responses.length * 100
    : 0;

  const attachmentQuality = responses.length > 0
    ? responses.filter((r: any) => r.attachments && r.attachments.length > 0).length / responses.length * 100
    : 0;

  const aiQualityRating = avgReadiness; // Simplified

  // Calculate reliability index (composite score)
  const performanceScore = winRate;
  const reliabilityIndex = (
    performanceScore * 0.4 +
    avgReadiness * 0.3 +
    competitivenessIndex * 0.3
  );

  return {
    participation: {
      rfpsInvited,
      rfpsResponded,
      rfpsSubmittedOnTime,
      rfpsWon,
      winRate
    },
    readiness: {
      avgReadiness,
      requirementsCoverage,
      complianceAlignment,
      riskFlagCount
    },
    pricing: {
      competitivenessIndex,
      deviationVsAverage,
      pricingStability
    },
    speed: {
      avgSubmissionSpeedDays,
      fastestSubmission,
      slowestSubmission
    },
    quality: {
      responseCompleteness,
      attachmentQuality,
      aiQualityRating
    },
    reliabilityIndex
  };
}

function calculateStability(values: number[]): number {
  if (values.length < 2) return 100;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100; // Coefficient of variation
  return Math.max(0, 100 - cv); // Higher is more stable
}

export async function calculateSupplierTrends(supplierId: string, limit: number = 5) {
  const responses = await prisma.supplierResponse.findMany({
    where: { supplierContactId: supplierId },
    include: {
      rfp: { select: { id: true, title: true } },
      attachments: true
    },
    orderBy: { submittedAt: "desc" },
    take: limit
  });

  return responses.map((r: any) => {
    // Extract risk flag count
    let riskFlags = 0;
    if (r.riskFlags && Array.isArray(r.riskFlags)) {
      riskFlags = (r.riskFlags as any[]).length;
    }

    return {
      rfpId: r.rfp.id,
      rfpTitle: r.rfp.title,
      finalScore: r.finalScore || 0,
      submittedAt: r.submittedAt,
      pricingScore: r.pricingScore || 0,
      readinessScore: r.readinessScore || 0,
      riskFlags
    };
  });
}

export async function calculateSupplierBenchmarks(supplierId: string) {
  // Get all responses for comparison
  const allResponses = await prisma.supplierResponse.findMany({
    where: { submittedAt: { not: null } },
    select: {
      supplierContactId: true,
      finalScore: true,
      submissionSpeedDays: true,
      pricingScore: true,
      readinessScore: true
    }
  });

  const supplierResponses = allResponses.filter((r: any) => r.supplierContactId === supplierId);
  const peerResponses = allResponses.filter((r: any) => r.supplierContactId !== supplierId);

  // Calculate averages
  const supplierAvgScore = avg(supplierResponses.map((r: any) => r.finalScore).filter(Boolean) as number[]);
  const peerAvgScore = avg(peerResponses.map((r: any) => r.finalScore).filter(Boolean) as number[]);

  const supplierAvgSpeed = avg(supplierResponses.map((r: any) => r.submissionSpeedDays).filter(Boolean) as number[]);
  const peerAvgSpeed = avg(peerResponses.map((r: any) => r.submissionSpeedDays).filter(Boolean) as number[]);

  const supplierAvgPricing = avg(supplierResponses.map((r: any) => r.pricingScore).filter(Boolean) as number[]);
  const peerAvgPricing = avg(peerResponses.map((r: any) => r.pricingScore).filter(Boolean) as number[]);

  // Calculate percentiles
  const speedPercentile = calculatePercentile(
    supplierAvgSpeed,
    peerResponses.map((r: any) => r.submissionSpeedDays).filter(Boolean) as number[]
  );

  return {
    scoreComparison: {
      supplier: supplierAvgScore,
      peers: peerAvgScore,
      difference: supplierAvgScore - peerAvgScore,
      percentile: calculatePercentile(
        supplierAvgScore,
        peerResponses.map((r: any) => r.finalScore).filter(Boolean) as number[]
      )
    },
    speedComparison: {
      supplier: supplierAvgSpeed,
      peers: peerAvgSpeed,
      difference: supplierAvgSpeed - peerAvgSpeed,
      percentile: speedPercentile
    },
    pricingComparison: {
      supplier: supplierAvgPricing,
      peers: peerAvgPricing,
      difference: supplierAvgPricing - peerAvgPricing,
      percentile: calculatePercentile(
        supplierAvgPricing,
        peerResponses.map((r: any) => r.pricingScore).filter(Boolean) as number[]
      )
    }
  };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculatePercentile(value: number, dataset: number[]): number {
  if (dataset.length === 0) return 50;
  const sorted = [...dataset].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  return (below / sorted.length) * 100;
}
