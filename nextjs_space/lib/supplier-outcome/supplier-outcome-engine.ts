/**
 * STEP 43: Supplier Outcome Dashboard - Core Engine
 * 
 * Extracts supplier outcomes, scores, compliance, strengths, and weaknesses
 * from existing RFP snapshots (scoring matrix, award) to build a comprehensive
 * post-award analytics dashboard.
 */

import { prisma } from "@/lib/prisma";

// ==============================================================================
// TypeScript Interfaces
// ==============================================================================

export interface SupplierOutcomeDetail {
  supplierId: string;
  supplierName: string;
  contactName: string | null;
  contactEmail: string | null;
  awardOutcome: "recommended" | "awarded" | "shortlisted" | "not_selected" | "declined" | "cancelled" | "unknown";
  overallScore: number | null;
  weightedScore: number | null;
  mustHaveCompliance: number | null; // percentage (0-100)
  strengths: string[]; // 3-6 items
  weaknesses: string[]; // 3-6 items
}

export interface SupplierOutcomeDashboard {
  rfpId: string;
  rfpTitle: string;
  generatedAt: string; // ISO timestamp
  
  suppliers: SupplierOutcomeDetail[];
  
  highLevel: {
    totalSuppliers: number;
    totalShortlisted: number;
    totalDeclined: number;
    totalAwarded: number;
    winnerName: string | null;
    averageScore: number | null;
  };
}

// ==============================================================================
// Main Service Function
// ==============================================================================

export async function buildSupplierOutcomeDashboard(
  rfpId: string,
  userId: string
): Promise<SupplierOutcomeDashboard> {
  // 1. Validate buyer access & company scope
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    select: {
      id: true,
      title: true,
      userId: true,
      awardStatus: true,
      awardedSupplierId: true,
      awardSnapshot: true,
      scoringMatrixSnapshot: true,
    },
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  if (rfp.userId !== userId) {
    throw new Error("Unauthorized: You do not own this RFP");
  }

  // 2. Load all suppliers linked to the RFP
  const supplierContacts = await prisma.supplierContact.findMany({
    where: { rfpId: rfpId },
    select: {
      id: true,
      name: true,
      email: true,
      organization: true,
      supplierResponse: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  // 3. Extract scoring matrix data (if available)
  const scoringMatrix = rfp.scoringMatrixSnapshot as any;
  const awardSnapshot = rfp.awardSnapshot as any;

  // 4. Build supplier detail array
  const suppliers: SupplierOutcomeDetail[] = supplierContacts.map((contact) => {
    const supplierId = contact.id;
    const supplierName = contact.name || contact.organization || "Unknown Supplier";

    // Determine award outcome
    let awardOutcome: SupplierOutcomeDetail["awardOutcome"] = "unknown";
    
    if (awardSnapshot?.supplierOutcomes) {
      // Extract from awardSnapshot supplierOutcomes array
      const outcomeEntry = awardSnapshot.supplierOutcomes.find(
        (s: any) => s.supplierContactId === supplierId
      );
      if (outcomeEntry?.outcome) {
        awardOutcome = outcomeEntry.outcome;
      }
    } else if (rfp.awardedSupplierId === supplierId) {
      // Fallback to awardedSupplierId field
      if (rfp.awardStatus === "awarded") {
        awardOutcome = "awarded";
      } else if (rfp.awardStatus === "recommended") {
        awardOutcome = "recommended";
      }
    }

    // Extract scores from scoring matrix (if available)
    let overallScore: number | null = null;
    let weightedScore: number | null = null;
    let mustHaveCompliance: number | null = null;
    let strengths: string[] = [];
    let weaknesses: string[] = [];

    if (scoringMatrix && scoringMatrix.supplierSummaries) {
      const supplierSummary = scoringMatrix.supplierSummaries.find(
        (s: any) => s.supplierContactId === supplierId
      );

      if (supplierSummary) {
        overallScore = supplierSummary.overallScore ?? null;
        weightedScore = supplierSummary.weightedScore ?? null;
        mustHaveCompliance = supplierSummary.mustHaveCompliance ?? null;

        // Extract strengths/weaknesses from AI narratives first
        if (supplierSummary.strengths && Array.isArray(supplierSummary.strengths)) {
          strengths = supplierSummary.strengths;
        }
        if (supplierSummary.weaknesses && Array.isArray(supplierSummary.weaknesses)) {
          weaknesses = supplierSummary.weaknesses;
        }

        // If no AI narratives, derive from category scores
        if (strengths.length === 0 && supplierSummary.categoryBreakdown) {
          strengths = deriveStrengthsFromCategories(supplierSummary.categoryBreakdown);
        }
        if (weaknesses.length === 0 && supplierSummary.categoryBreakdown) {
          weaknesses = deriveWeaknessesFromCategories(supplierSummary.categoryBreakdown);
        }
      }
    }

    return {
      supplierId,
      supplierName,
      contactName: contact.name,
      contactEmail: contact.email,
      awardOutcome,
      overallScore,
      weightedScore,
      mustHaveCompliance,
      strengths,
      weaknesses,
    };
  });

  // 5. Calculate high-level summary statistics
  const totalSuppliers = suppliers.length;
  const totalShortlisted = suppliers.filter(s => s.awardOutcome === "shortlisted").length;
  const totalDeclined = suppliers.filter(s => s.awardOutcome === "declined").length;
  const totalAwarded = suppliers.filter(s => s.awardOutcome === "awarded" || s.awardOutcome === "recommended").length;
  
  const winnerSupplier = suppliers.find(s => s.awardOutcome === "awarded" || s.awardOutcome === "recommended");
  const winnerName = winnerSupplier?.supplierName ?? null;

  const suppliersWithScores = suppliers.filter(s => s.overallScore !== null);
  const averageScore = suppliersWithScores.length > 0
    ? Math.round(
        suppliersWithScores.reduce((sum, s) => sum + (s.overallScore || 0), 0) / suppliersWithScores.length
      )
    : null;

  // 6. Return complete dashboard object
  return {
    rfpId: rfp.id,
    rfpTitle: rfp.title,
    generatedAt: new Date().toISOString(),
    suppliers,
    highLevel: {
      totalSuppliers,
      totalShortlisted,
      totalDeclined,
      totalAwarded,
      winnerName,
      averageScore,
    },
  };
}

// ==============================================================================
// Helper Functions
// ==============================================================================

function deriveStrengthsFromCategories(categoryBreakdown: any[]): string[] {
  const strengths: string[] = [];
  
  for (const category of categoryBreakdown) {
    // Strength: categories where weightedScore >= 80%
    if (category.weightedScore && category.weightedScore >= 80) {
      strengths.push(`Strong ${category.categoryLabel || category.categoryId}: ${category.weightedScore.toFixed(0)}%`);
    }
  }

  return strengths.slice(0, 6); // Limit to 6
}

function deriveWeaknessesFromCategories(categoryBreakdown: any[]): string[] {
  const weaknesses: string[] = [];
  
  for (const category of categoryBreakdown) {
    // Weakness: categories where weightedScore <= 60%
    if (category.weightedScore && category.weightedScore <= 60) {
      weaknesses.push(`Weak ${category.categoryLabel || category.categoryId}: ${category.weightedScore.toFixed(0)}%`);
    }
  }

  return weaknesses.slice(0, 6); // Limit to 6
}
