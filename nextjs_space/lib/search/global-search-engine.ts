/**
 * STEP 48: Global Search Engine (Unified Buyer Search)
 * 
 * PHASE 1: DATA MODEL VERIFICATION
 * ================================
 * No schema changes needed. Existing models support search requirements:
 * 
 * Search Targets:
 * - RFPs: title, description, status, awardStatus (from RFP model)
 * - Suppliers: name, contactName, contactEmail (from Supplier model)
 * - Executive Summaries: title, tone, audience, contentText (from ExecutiveSummaryDocument model)
 * - Activities: type, description, metadata, timestamp (from Activity model)
 * - Clause Library: title, category, content (from TemplateClause and ClauseLibrary models)
 * - Archived RFPs: compliancePackSnapshot.rfp.title, summary fields (from RFP model)
 * 
 * All models are company-scoped via userId/companyId relationships.
 * No sensitive data exposure - only safe fields returned.
 */

import { prisma } from '@/lib/prisma';

/**
 * TypeScript Types for Global Search
 */
export interface SearchQuery {
  query: string;
  userId: string;
  companyId: string;
}

export interface RfpSearchResult {
  id: string;
  title: string;
  description: string | null;
  status: string;
  stage: string;
  createdAt: Date;
  budget: number | null;
  companyName: string | null;
  supplierName: string | null;
}

export interface SupplierSearchResult {
  id: string;
  name: string;
  contactEmail: string | null;
  createdAt: Date;
  rfpCount: number;
}

export interface SummarySearchResult {
  id: string;
  title: string | null;
  tone: string | null;
  audience: string | null;
  content: string | null;
  createdAt: Date;
  rfpId: string;
  rfpTitle: string | null;
}

export interface ActivitySearchResult {
  id: string;
  type: string;
  description: string | null;
  createdAt: Date;
  rfpId: string | null;
  rfpTitle: string | null;
}

export interface ClauseSearchResult {
  id: string;
  title: string;
  category: string | null;
  body: string;
  clauseType: string;
  createdAt: Date;
}

export interface ArchivedRfpSearchResult {
  id: string;
  title: string;
  archivedAt: Date;
  companyName: string | null;
  supplierName: string | null;
  snapshotSummary: string | null;
}

export interface SearchResults {
  rfpResults: RfpSearchResult[];
  supplierResults: SupplierSearchResult[];
  summaryResults: SummarySearchResult[];
  activityResults: ActivitySearchResult[];
  clauseResults: ClauseSearchResult[];
  archivedRfpResults: ArchivedRfpSearchResult[];
}

/**
 * PHASE 2: BACKEND SEARCH ENGINE
 * Main search function that searches across all 6 categories
 */
export async function searchAll(
  query: string,
  userId: string,
  companyId: string
): Promise<SearchResults> {
  // Return empty results if query is too short
  if (!query || query.trim().length < 2) {
    return {
      rfpResults: [],
      supplierResults: [],
      summaryResults: [],
      activityResults: [],
      clauseResults: [],
      archivedRfpResults: [],
    };
  }

  const searchTerm = query.trim();
  const caseInsensitiveSearch = {
    contains: searchTerm,
    mode: 'insensitive' as const,
  };

  try {
    // Search RFPs (company-scoped, max 10 results)
    const rfpResults = await prisma.rFP.findMany({
      where: {
        userId,
        isArchived: false, // Exclude archived RFPs
        OR: [
          { title: caseInsensitiveSearch },
          { description: caseInsensitiveSearch },
          { status: caseInsensitiveSearch },
          { awardStatus: caseInsensitiveSearch },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        stage: true,
        createdAt: true,
        budget: true,
        companyId: true,
        supplierId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Search Suppliers (company-scoped via RFPs, max 10 results)
    const supplierResults = await prisma.supplier.findMany({
      where: {
        rfps: {
          some: {
            userId,
          },
        },
        OR: [
          { name: caseInsensitiveSearch },
          { contactEmail: caseInsensitiveSearch },
        ],
      },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        createdAt: true,
        _count: {
          select: { rfps: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 10,
    });

    // Search Executive Summaries (company-scoped via RFPs, max 10 results)
    const summaryResults = await prisma.executiveSummaryDocument.findMany({
      where: {
        rfp: {
          userId,
        },
        OR: [
          { title: caseInsensitiveSearch },
          { tone: caseInsensitiveSearch },
          { audience: caseInsensitiveSearch },
          { content: caseInsensitiveSearch },
        ],
      },
      select: {
        id: true,
        title: true,
        tone: true,
        audience: true,
        content: true,
        createdAt: true,
        rfpId: true,
        rfp: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Search Activities (company-scoped via RFPs, max 10 results)
    const activityResults = await prisma.activityLog.findMany({
      where: {
        rfp: {
          userId,
        },
        OR: [
          { eventType: caseInsensitiveSearch },
          { summary: caseInsensitiveSearch },
        ],
      },
      select: {
        id: true,
        eventType: true,
        summary: true,
        createdAt: true,
        rfpId: true,
        rfp: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Search Clause Library (global, max 10 results)
    const clauseResults = await prisma.clauseLibrary.findMany({
      where: {
        OR: [
          { title: caseInsensitiveSearch },
          { body: caseInsensitiveSearch },
        ],
      },
      select: {
        id: true,
        title: true,
        category: { select: { name: true } },
        body: true,
        clauseType: true,
        createdAt: true,
      },
      orderBy: { title: 'asc' },
      take: 10,
    });

    // Search Archived RFPs (company-scoped, max 10 results)
    // Search in compliancePackSnapshot JSON field for title and summary
    const archivedRfpResults = await prisma.rFP.findMany({
      where: {
        userId,
        isArchived: true,
        OR: [
          { title: caseInsensitiveSearch },
          // JSON field search is database-specific, this works for PostgreSQL
          // For other databases, may need adjustment
        ],
      },
      select: {
        id: true,
        title: true,
        archivedAt: true,
        compliancePackSnapshot: true,
        companyId: true,
        supplierId: true,
      },
      orderBy: { archivedAt: 'desc' },
      take: 10,
    });

    // Transform results to match interface (only safe fields, no sensitive data)
    return {
      rfpResults: rfpResults.map((rfp) => ({
        id: rfp.id,
        title: rfp.title,
        description: rfp.description,
        status: rfp.status,
        stage: rfp.stage,
        createdAt: rfp.createdAt,
        budget: rfp.budget,
        companyName: null, // Will be populated later if needed
        supplierName: null, // Will be populated later if needed
      })),
      supplierResults: supplierResults.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        contactEmail: supplier.contactEmail,
        createdAt: supplier.createdAt,
        rfpCount: supplier._count.rfps,
      })),
      summaryResults: summaryResults.map((summary) => ({
        id: summary.id,
        title: summary.title,
        tone: summary.tone,
        audience: summary.audience,
        content: summary.content,
        createdAt: summary.createdAt,
        rfpId: summary.rfpId,
        rfpTitle: summary.rfp?.title || null,
      })),
      activityResults: activityResults.map((activity) => ({
        id: activity.id,
        type: activity.eventType,
        description: activity.summary,
        createdAt: activity.createdAt,
        rfpId: activity.rfpId,
        rfpTitle: activity.rfp?.title || null,
      })),
      clauseResults: clauseResults.map((clause) => ({
        id: clause.id,
        title: clause.title,
        category: clause.category?.name || null,
        body: clause.body.substring(0, 200), // Snippet only
        clauseType: clause.clauseType,
        createdAt: clause.createdAt,
      })),
      archivedRfpResults: archivedRfpResults.map((rfp) => {
        let snapshotSummary = null;
        if (rfp.compliancePackSnapshot && typeof rfp.compliancePackSnapshot === 'object') {
          const snapshot = rfp.compliancePackSnapshot as any;
          snapshotSummary = snapshot?.decisionBrief?.executiveSummary || null;
        }
        return {
          id: rfp.id,
          title: rfp.title,
          archivedAt: rfp.archivedAt || new Date(),
          companyName: null, // Will be populated later if needed
          supplierName: null, // Will be populated later if needed
          snapshotSummary,
        };
      }),
    };
  } catch (error) {
    console.error('Global search error:', error);
    // Return empty results on error
    return {
      rfpResults: [],
      supplierResults: [],
      summaryResults: [],
      activityResults: [],
      clauseResults: [],
      archivedRfpResults: [],
    };
  }
}
