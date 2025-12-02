/**
 * STEP 41: Award Recommendation & RFP Finalization Service
 * 
 * This service handles the finalization of award decisions for RFPs.
 * It creates frozen snapshots of decision data and updates RFP status.
 * 
 * SCOPE: Pre-award only - no post-award procurement functionality.
 */

import { prisma } from "@/lib/prisma";

// ====================================================================
// TYPES
// ====================================================================

export interface AwardDecisionPayload {
  rfpId: string;
  selectedSupplierId: string | null; // null if cancelled
  status: "recommended" | "awarded" | "cancelled";
  buyerNotes: string;
  supplierOutcomeMap?: Record<string, string>; // supplierResponseId -> outcome status
}

export interface AwardSnapshot {
  rfpId: string;
  decidedAt: string;
  decidedByUserId: string;
  status: "recommended" | "awarded" | "cancelled";
  recommendedSupplierId: string | null;
  recommendedSupplierName: string | null;
  decisionBriefSummary: {
    keyDrivers: string[];
    keyRisks: string[];
    mustHaveCompliance: boolean | null;
  };
  scoringMatrixSummary: {
    topSuppliers: Array<{
      id: string;
      name: string;
      overallScore: number | null;
      weightedScore: number | null;
      mustHaveCompliance: boolean | null;
    }>;
  };
  timelineSummary: {
    createdAt: string;
    targetAwardDate: string | null;
    actualAwardDate: string;
    elapsedDays: number;
  };
  portfolioSummary: {
    totalRfps: number | null;
    averageScore: number | null;
    companyName: string | null;
  };
  buyerNotes: string;
}

// ====================================================================
// MAIN SERVICE FUNCTION
// ====================================================================

/**
 * Finalizes the award decision for an RFP
 * Creates a frozen snapshot and updates RFP fields
 */
export async function finalizeAwardDecision(
  payload: AwardDecisionPayload,
  userId: string
): Promise<{ rfp: any; snapshot: AwardSnapshot }> {
  const { rfpId, selectedSupplierId, status, buyerNotes, supplierOutcomeMap } = payload;

  // Load RFP with all necessary data
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      user: true,
      company: true,
      supplier: true,
      supplierResponses: {
        include: {
          supplierContact: true,
        },
      },
    },
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  // Validate buyer access and company scope
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  if (currentUser.role !== "buyer") {
    throw new Error("Only buyers can finalize award decisions");
  }

  // Company scope check - user must be from the same company as the RFP
  if (rfp.userId !== userId && rfp.companyId !== currentUser.id) {
    // Allow if user is from the same company
    const userBelongsToCompany = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        companyId: rfp.companyId,
      },
    });

    if (!userBelongsToCompany) {
      throw new Error("Access denied - company scope violation");
    }
  }

  // Get selected supplier name if applicable
  let selectedSupplierName: string | null = null;
  if (selectedSupplierId && status !== "cancelled") {
    const selectedResponse = rfp.supplierResponses.find(
      (r: any) => r.supplierContactId === selectedSupplierId || r.supplierContact.id === selectedSupplierId
    );
    if (selectedResponse) {
      selectedSupplierName = selectedResponse.supplierContact.organization || selectedResponse.supplierContact.name;
    }
  }

  // Build award snapshot
  const snapshot = await buildAwardSnapshot({
    rfp,
    userId,
    selectedSupplierId,
    selectedSupplierName,
    status,
    buyerNotes,
  });

  // Update RFP with award decision
  const updatedRfp = await prisma.rFP.update({
    where: { id: rfpId },
    data: {
      awardedSupplierId: selectedSupplierId,
      awardStatus: status,
      awardDecidedAt: new Date(),
      awardDecidedByUserId: userId,
      awardSnapshot: snapshot as any,
      awardNotes: buyerNotes,
    },
  });

  // Update supplier outcome statuses if provided
  if (supplierOutcomeMap && Object.keys(supplierOutcomeMap).length > 0) {
    await updateSupplierOutcomes(rfpId, supplierOutcomeMap);
  }

  // STEP 41 PHASE 5: Update timeline engine to AWARD phase
  await updateTimelineToAwardPhase(rfpId);

  return { rfp: updatedRfp, snapshot };
}

/**
 * Builds the award snapshot without persisting
 * Used for preview functionality
 */
export async function buildAwardSnapshotPreview(
  rfpId: string,
  selectedSupplierId: string | null,
  status: "recommended" | "awarded" | "cancelled",
  buyerNotes: string,
  userId: string
): Promise<AwardSnapshot> {
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      user: true,
      company: true,
      supplier: true,
      supplierResponses: {
        include: {
          supplierContact: true,
        },
      },
    },
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  let selectedSupplierName: string | null = null;
  if (selectedSupplierId && status !== "cancelled") {
    const selectedResponse = rfp.supplierResponses.find(
      (r: any) => r.supplierContactId === selectedSupplierId || r.supplierContact.id === selectedSupplierId
    );
    if (selectedResponse) {
      selectedSupplierName = selectedResponse.supplierContact.organization || selectedResponse.supplierContact.name;
    }
  }

  return buildAwardSnapshot({
    rfp,
    userId,
    selectedSupplierId,
    selectedSupplierName,
    status,
    buyerNotes,
  });
}

// ====================================================================
// INTERNAL HELPER FUNCTIONS
// ====================================================================

/**
 * Builds the complete award snapshot from RFP data
 */
async function buildAwardSnapshot(params: {
  rfp: any;
  userId: string;
  selectedSupplierId: string | null;
  selectedSupplierName: string | null;
  status: "recommended" | "awarded" | "cancelled";
  buyerNotes: string;
}): Promise<AwardSnapshot> {
  const { rfp, userId, selectedSupplierId, selectedSupplierName, status, buyerNotes } = params;

  const now = new Date();
  const createdAt = rfp.createdAt;
  const elapsedDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Extract decision brief summary
  const decisionBriefSummary = extractDecisionBriefSummary(rfp.decisionBriefSnapshot);

  // Extract scoring matrix summary
  const scoringMatrixSummary = extractScoringMatrixSummary(rfp.scoringMatrixSnapshot);

  // Extract timeline summary
  const timelineSummary = {
    createdAt: rfp.createdAt.toISOString(),
    targetAwardDate: rfp.awardDate?.toISOString() || null,
    actualAwardDate: now.toISOString(),
    elapsedDays,
  };

  // Extract portfolio summary
  const portfolioSummary = await extractPortfolioSummary(rfp.companyId);

  const snapshot: AwardSnapshot = {
    rfpId: rfp.id,
    decidedAt: now.toISOString(),
    decidedByUserId: userId,
    status,
    recommendedSupplierId: selectedSupplierId,
    recommendedSupplierName: selectedSupplierName,
    decisionBriefSummary,
    scoringMatrixSummary,
    timelineSummary,
    portfolioSummary,
    buyerNotes,
  };

  return snapshot;
}

/**
 * Extracts key drivers and risks from decision brief snapshot
 */
function extractDecisionBriefSummary(decisionBriefSnapshot: any): {
  keyDrivers: string[];
  keyRisks: string[];
  mustHaveCompliance: boolean | null;
} {
  if (!decisionBriefSnapshot) {
    return {
      keyDrivers: [],
      keyRisks: [],
      mustHaveCompliance: null,
    };
  }

  try {
    const data = typeof decisionBriefSnapshot === "string" 
      ? JSON.parse(decisionBriefSnapshot) 
      : decisionBriefSnapshot;

    return {
      keyDrivers: data.keyDrivers || data.drivers || [],
      keyRisks: data.keyRisks || data.risks || [],
      mustHaveCompliance: data.mustHaveCompliance || null,
    };
  } catch (error) {
    console.error("Error parsing decision brief snapshot:", error);
    return {
      keyDrivers: [],
      keyRisks: [],
      mustHaveCompliance: null,
    };
  }
}

/**
 * Extracts top suppliers from scoring matrix snapshot
 */
function extractScoringMatrixSummary(scoringMatrixSnapshot: any): {
  topSuppliers: Array<{
    id: string;
    name: string;
    overallScore: number | null;
    weightedScore: number | null;
    mustHaveCompliance: boolean | null;
  }>;
} {
  if (!scoringMatrixSnapshot) {
    return { topSuppliers: [] };
  }

  try {
    const data = typeof scoringMatrixSnapshot === "string" 
      ? JSON.parse(scoringMatrixSnapshot) 
      : scoringMatrixSnapshot;

    const suppliers = data.suppliers || data.topSuppliers || [];
    
    // Sort by weighted score and take top 3
    const topSuppliers = suppliers
      .slice(0, 3)
      .map((s: any) => ({
        id: s.id || s.supplierId || "",
        name: s.name || s.supplierName || "Unknown Supplier",
        overallScore: s.overallScore || s.score || null,
        weightedScore: s.weightedScore || s.totalScore || null,
        mustHaveCompliance: s.mustHaveCompliance || s.compliant || null,
      }));

    return { topSuppliers };
  } catch (error) {
    console.error("Error parsing scoring matrix snapshot:", error);
    return { topSuppliers: [] };
  }
}

/**
 * Extracts portfolio summary from company data
 */
async function extractPortfolioSummary(companyId: string): Promise<{
  totalRfps: number | null;
  averageScore: number | null;
  companyName: string | null;
}> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        rfps: {
          select: {
            opportunityScore: true,
          },
        },
      },
    });

    if (!company) {
      return {
        totalRfps: null,
        averageScore: null,
        companyName: null,
      };
    }

    const totalRfps = company.rfps.length;
    const scores = company.rfps
      .map((r: any) => r.opportunityScore)
      .filter((s: any) => s !== null);
    const averageScore = scores.length > 0
      ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
      : null;

    return {
      totalRfps,
      averageScore,
      companyName: company.name,
    };
  } catch (error) {
    console.error("Error extracting portfolio summary:", error);
    return {
      totalRfps: null,
      averageScore: null,
      companyName: null,
    };
  }
}

/**
 * Updates supplier outcome statuses
 */
async function updateSupplierOutcomes(
  rfpId: string,
  supplierOutcomeMap: Record<string, string>
): Promise<void> {
  const updates = Object.entries(supplierOutcomeMap).map(([responseId, outcome]) =>
    prisma.supplierResponse.update({
      where: { id: responseId },
      data: { awardOutcomeStatus: outcome },
    })
  );

  await Promise.all(updates);
}

/**
 * Retrieves the current award status for an RFP
 */
export async function getAwardStatus(rfpId: string): Promise<{
  awardStatus: string | null;
  awardedSupplierId: string | null;
  awardDecidedAt: Date | null;
  awardDecidedByUserId: string | null;
  awardNotes: string | null;
  awardSnapshot: AwardSnapshot | null;
}> {
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    select: {
      awardStatus: true,
      awardedSupplierId: true,
      awardDecidedAt: true,
      awardDecidedByUserId: true,
      awardNotes: true,
      awardSnapshot: true,
    },
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  return {
    awardStatus: rfp.awardStatus,
    awardedSupplierId: rfp.awardedSupplierId,
    awardDecidedAt: rfp.awardDecidedAt,
    awardDecidedByUserId: rfp.awardDecidedByUserId,
    awardNotes: rfp.awardNotes,
    awardSnapshot: rfp.awardSnapshot as AwardSnapshot | null,
  };
}

/**
 * Updates the timeline engine to mark RFP as in AWARD phase
 * STEP 41 PHASE 5: Timeline Integration
 */
async function updateTimelineToAwardPhase(rfpId: string): Promise<void> {
  try {
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        timelineConfig: true,
        timelineStateSnapshot: true,
      },
    });

    if (!rfp || !rfp.timelineConfig) {
      // No timeline configured, skip
      return;
    }

    const config = typeof rfp.timelineConfig === "string" 
      ? JSON.parse(rfp.timelineConfig) 
      : rfp.timelineConfig;

    // Update the keyDates to mark award as reached
    if (!config.keyDates.awardTargetAt) {
      config.keyDates.awardTargetAt = new Date().toISOString();
    }

    // Update the timeline state snapshot to reflect AWARD phase
    const stateSnapshot = rfp.timelineStateSnapshot 
      ? (typeof rfp.timelineStateSnapshot === "string" 
          ? JSON.parse(rfp.timelineStateSnapshot) 
          : rfp.timelineStateSnapshot)
      : null;

    if (stateSnapshot) {
      stateSnapshot.currentPhase = "award";
      
      // Mark AWARD phase as current
      if (stateSnapshot.phases) {
        stateSnapshot.phases = stateSnapshot.phases.map((phase: any) => {
          if (phase.phaseId === "award") {
            return {
              ...phase,
              isCurrent: true,
              isCompleted: false,
              isUpcoming: false,
            };
          } else {
            return {
              ...phase,
              isCurrent: false,
              isCompleted: true,
              isUpcoming: false,
            };
          }
        });
      }

      await prisma.rFP.update({
        where: { id: rfpId },
        data: {
          timelineConfig: config as any,
          timelineStateSnapshot: stateSnapshot as any,
        },
      });
    } else {
      // Just update the config
      await prisma.rFP.update({
        where: { id: rfpId },
        data: {
          timelineConfig: config as any,
        },
      });
    }
  } catch (error) {
    console.error("Error updating timeline to AWARD phase:", error);
    // Don't throw - this is a non-critical integration
  }
}
