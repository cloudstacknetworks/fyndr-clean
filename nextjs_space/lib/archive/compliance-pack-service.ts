/**
 * STEP 47: RFP Archive and Compliance Pack (Pre-Award Closure and Audit Bundle)
 * 
 * Compliance Pack Snapshot Builder Service
 * 
 * Purpose: Generates a comprehensive, read-only snapshot of all pre-award RFP artifacts
 * for archiving and compliance audit trail.
 */

import { prisma } from '@/lib/prisma';

export interface CompliancePackSnapshot {
  // Core RFP Data
  rfpId: string;
  rfpTitle: string;
  rfpDescription: string | null;
  company: {
    id: string;
    name: string;
  };
  supplier: {
    id: string;
    name: string;
  };
  
  // Timeline Summary
  timeline: {
    createdAt: string;
    askQuestionsStart: string | null;
    askQuestionsEnd: string | null;
    submissionStart: string | null;
    submissionEnd: string | null;
    demoWindowStart: string | null;
    demoWindowEnd: string | null;
    awardDate: string | null;
    archivedAt: string;
  };
  
  // Decision Brief
  decisionBrief: {
    available: boolean;
    recommendation: any | null;
    supplierSummaries: any[] | null;
    riskSummary: any | null;
  };
  
  // Scoring Summary
  scoring: {
    opportunityScore: number | null;
    opportunityBreakdown: any | null;
    scoringMatrix: any | null;
    comparisonNarrative: any | null;
  };
  
  // Executive Summary
  executiveSummary: {
    latest: any | null;
    versions: number;
  };
  
  // Award Decision
  award: {
    awardStatus: string | null;
    awardedSupplierId: string | null;
    awardDecidedAt: string | null;
    awardDecidedBy: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    awardSnapshot: any | null;
    awardNotes: string | null;
  };
  
  // Supplier Outcomes
  supplierOutcomes: {
    supplierId: string;
    supplierName: string;
    contactEmail: string | null;
    invitationStatus: string | null;
    invitedAt: string | null;
    responseStatus: string | null;
    submittedAt: string | null;
    awardOutcomeStatus: string | null;
    readinessIndicator: string | null;
    comparisonScore: number | null;
  }[];
  
  // Timeline Summary Counts
  timelineSummary: {
    totalQuestions: number;
    answeredQuestions: number;
    totalBroadcasts: number;
    totalResponses: number;
    submittedResponses: number;
  };
  
  // Portfolio Context
  portfolioContext: {
    companyId: string;
    companyName: string;
    totalActiveRFPs: number;
    totalArchivedRFPs: number;
  };
  
  // Metadata
  metadata: {
    generatedAt: string;
    generatedBy: {
      id: string;
      name: string | null;
      email: string;
    };
    version: string;
  };
}

/**
 * Builds a comprehensive compliance pack snapshot for an RFP.
 * Does NOT persist to database - returns the structured data only.
 * Uses graceful degradation for missing data.
 */
export async function buildCompliancePackSnapshot(
  rfpId: string,
  userId: string
): Promise<CompliancePackSnapshot> {
  // Fetch comprehensive RFP data
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      company: true,
      supplier: true,
      user: true,
      awardDecidedBy: true,
      supplierContacts: {
        include: {
          supplierResponse: true,
        },
      },
      supplierQuestions: true,
      supplierBroadcastMessages: true,
      executiveSummaries: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!rfp) {
    throw new Error('RFP not found');
  }

  // Fetch user who is archiving
  const archiverUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!archiverUser) {
    throw new Error('Archiver user not found');
  }

  // Get company-level portfolio context
  const companyRfpCounts = await prisma.rFP.groupBy({
    by: ['isArchived'],
    where: { companyId: rfp.companyId },
    _count: true,
  });

  const totalActiveRFPs = companyRfpCounts.find(g => g.isArchived === false)?._count || 0;
  const totalArchivedRFPs = companyRfpCounts.find(g => g.isArchived === true)?._count || 0;

  // Build decision brief section with graceful degradation
  const decisionBrief = rfp.decisionBriefSnapshot as any || null;
  
  // Build scoring section
  const scoringMatrix = rfp.scoringMatrixSnapshot as any || null;
  const comparisonNarrative = rfp.comparisonNarrative as any || null;
  
  // Build executive summary section
  const latestExecSummary = rfp.executiveSummaries[0] || null;
  const execSummaryVersionsCount = await prisma.executiveSummaryDocument.count({
    where: { rfpId },
  });
  
  // Build supplier outcomes
  const supplierOutcomes = rfp.supplierContacts.map(contact => ({
    supplierId: contact.id,
    supplierName: contact.name,
    contactEmail: contact.email,
    invitationStatus: contact.invitationStatus || null,
    invitedAt: contact.invitedAt?.toISOString() || null,
    responseStatus: contact.supplierResponse?.status || null,
    submittedAt: contact.supplierResponse?.submittedAt?.toISOString() || null,
    awardOutcomeStatus: contact.supplierResponse?.awardOutcomeStatus || null,
    readinessIndicator: contact.supplierResponse?.readinessIndicator || null,
    comparisonScore: contact.supplierResponse?.comparisonScore || null,
  }));
  
  // Build timeline summary counts
  const totalQuestions = rfp.supplierQuestions.length;
  const answeredQuestions = rfp.supplierQuestions.filter(q => q.status === 'ANSWERED').length;
  const totalBroadcasts = rfp.supplierBroadcastMessages.length;
  const totalResponses = rfp.supplierContacts.filter(c => c.supplierResponse !== null).length;
  const submittedResponses = rfp.supplierContacts.filter(
    c => c.supplierResponse?.status === 'SUBMITTED'
  ).length;

  // Build the complete snapshot
  const snapshot: CompliancePackSnapshot = {
    // Core RFP Data
    rfpId: rfp.id,
    rfpTitle: rfp.title,
    rfpDescription: rfp.description,
    company: {
      id: rfp.company.id,
      name: rfp.company.name,
    },
    supplier: {
      id: rfp.supplier.id,
      name: rfp.supplier.name,
    },
    
    // Timeline Summary
    timeline: {
      createdAt: rfp.createdAt.toISOString(),
      askQuestionsStart: rfp.askQuestionsStart?.toISOString() || null,
      askQuestionsEnd: rfp.askQuestionsEnd?.toISOString() || null,
      submissionStart: rfp.submissionStart?.toISOString() || null,
      submissionEnd: rfp.submissionEnd?.toISOString() || null,
      demoWindowStart: rfp.demoWindowStart?.toISOString() || null,
      demoWindowEnd: rfp.demoWindowEnd?.toISOString() || null,
      awardDate: rfp.awardDate?.toISOString() || null,
      archivedAt: new Date().toISOString(),
    },
    
    // Decision Brief
    decisionBrief: {
      available: decisionBrief !== null,
      recommendation: decisionBrief?.recommendation || null,
      supplierSummaries: decisionBrief?.supplierSummaries || null,
      riskSummary: decisionBrief?.riskSummary || null,
    },
    
    // Scoring Summary
    scoring: {
      opportunityScore: rfp.opportunityScore,
      opportunityBreakdown: rfp.opportunityScoreBreakdown as any || null,
      scoringMatrix: scoringMatrix,
      comparisonNarrative: comparisonNarrative,
    },
    
    // Executive Summary
    executiveSummary: {
      latest: latestExecSummary ? {
        id: latestExecSummary.id,
        createdAt: latestExecSummary.createdAt.toISOString(),
        content: latestExecSummary.content,
      } : null,
      versions: execSummaryVersionsCount,
    },
    
    // Award Decision
    award: {
      awardStatus: rfp.awardStatus,
      awardedSupplierId: rfp.awardedSupplierId,
      awardDecidedAt: rfp.awardDecidedAt?.toISOString() || null,
      awardDecidedBy: rfp.awardDecidedBy ? {
        id: rfp.awardDecidedBy.id,
        name: rfp.awardDecidedBy.name,
        email: rfp.awardDecidedBy.email,
      } : null,
      awardSnapshot: rfp.awardSnapshot as any || null,
      awardNotes: rfp.awardNotes,
    },
    
    // Supplier Outcomes
    supplierOutcomes,
    
    // Timeline Summary
    timelineSummary: {
      totalQuestions,
      answeredQuestions,
      totalBroadcasts,
      totalResponses,
      submittedResponses,
    },
    
    // Portfolio Context
    portfolioContext: {
      companyId: rfp.company.id,
      companyName: rfp.company.name,
      totalActiveRFPs,
      totalArchivedRFPs,
    },
    
    // Metadata
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: {
        id: archiverUser.id,
        name: archiverUser.name,
        email: archiverUser.email,
      },
      version: '1.0',
    },
  };

  return snapshot;
}

/**
 * Finalizes the compliance pack and archives the RFP.
 * Builds the snapshot, persists it, and sets isArchived=true.
 * This is the "commit" action.
 */
export async function finalizeCompliancePackAndArchive(
  rfpId: string,
  userId: string
): Promise<{ success: boolean; snapshot: CompliancePackSnapshot; rfp: any }> {
  // Build the snapshot
  const snapshot = await buildCompliancePackSnapshot(rfpId, userId);
  
  // Persist to database
  const updatedRfp = await prisma.rFP.update({
    where: { id: rfpId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedByUserId: userId,
      compliancePackSnapshot: snapshot as any,
    },
    include: {
      company: true,
      supplier: true,
      archivedBy: true,
    },
  });

  return {
    success: true,
    snapshot,
    rfp: updatedRfp,
  };
}
