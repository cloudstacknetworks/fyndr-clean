/**
 * lib/rfp-templates/clause-engine.ts
 * 
 * STEP 38B: Clause Library Engine
 * 
 * Core logic for managing the clause library and injecting clauses into templates.
 * Provides:
 * - CRUD operations for clauses and categories
 * - Template-clause linking
 * - Clause injection into RFP templates
 * - Snapshot management for applied clauses
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// TYPES
// ============================================================================

export interface ClauseCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClauseLibraryItem {
  id: string;
  categoryId: string;
  category?: ClauseCategory;
  title: string;
  description: string;
  body: string;
  isRequired: boolean;
  clauseType: "legal" | "commercial" | "security" | "sow" | "other";
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClauseInput {
  categoryId: string;
  title: string;
  description: string;
  body: string;
  isRequired?: boolean;
  clauseType: "legal" | "commercial" | "security" | "sow" | "other";
  order?: number;
}

export interface UpdateClauseInput {
  title?: string;
  description?: string;
  body?: string;
  isRequired?: boolean;
  clauseType?: "legal" | "commercial" | "security" | "sow" | "other";
  order?: number;
  categoryId?: string;
}

export interface TemplateClauseLink {
  id: string;
  templateId: string;
  clauseId: string;
  clause: ClauseLibraryItem;
  required: boolean;
  insertedAt: Date;
  createdById: string | null;
}

// ============================================================================
// CLAUSE CATEGORY OPERATIONS
// ============================================================================

/**
 * List all clause categories, ordered by custom order
 */
export async function listClauseCategories(): Promise<ClauseCategory[]> {
  return await prisma.clauseCategory.findMany({
    orderBy: { order: 'asc' }
  });
}

/**
 * Create a new clause category
 */
export async function createClauseCategory(
  name: string,
  description?: string,
  order?: number
): Promise<ClauseCategory> {
  return await prisma.clauseCategory.create({
    data: {
      name,
      description: description || null,
      order: order ?? 0,
    },
  });
}

// ============================================================================
// CLAUSE LIBRARY OPERATIONS
// ============================================================================

/**
 * List all clauses with optional filtering by category and type
 */
export async function listClauses(
  categoryId?: string,
  clauseType?: string
): Promise<ClauseLibraryItem[]> {
  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (clauseType) where.clauseType = clauseType;

  return await prisma.clauseLibrary.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' }
    ],
  }) as any as ClauseLibraryItem[];
}

/**
 * Get a single clause by ID
 */
export async function getClauseById(clauseId: string): Promise<ClauseLibraryItem | null> {
  return await prisma.clauseLibrary.findUnique({
    where: { id: clauseId },
    include: {
      category: true,
    },
  }) as any as ClauseLibraryItem | null;
}

/**
 * Create a new clause in the library
 */
export async function createClause(input: CreateClauseInput): Promise<ClauseLibraryItem> {
  return await prisma.clauseLibrary.create({
    data: {
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      body: input.body,
      isRequired: input.isRequired ?? false,
      clauseType: input.clauseType,
      order: input.order ?? 0,
    },
    include: {
      category: true,
    },
  }) as any as ClauseLibraryItem;
}

/**
 * Update an existing clause
 */
export async function updateClause(
  clauseId: string,
  input: UpdateClauseInput
): Promise<ClauseLibraryItem> {
  return await prisma.clauseLibrary.update({
    where: { id: clauseId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.isRequired !== undefined && { isRequired: input.isRequired }),
      ...(input.clauseType !== undefined && { clauseType: input.clauseType }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    },
    include: {
      category: true,
    },
  }) as any as ClauseLibraryItem;
}

/**
 * Delete a clause from the library
 * Note: Will cascade delete all template-clause links
 */
export async function deleteClause(clauseId: string): Promise<void> {
  await prisma.clauseLibrary.delete({
    where: { id: clauseId },
  });
}

// ============================================================================
// TEMPLATE-CLAUSE LINKING
// ============================================================================

/**
 * Link a clause to a template
 */
export async function linkClauseToTemplate(
  templateId: string,
  clauseId: string,
  required: boolean = false,
  createdById?: string
): Promise<TemplateClauseLink> {
  // First check if link already exists
  const existing = await prisma.rfpTemplateClauseLink.findUnique({
    where: {
      templateId_clauseId: {
        templateId,
        clauseId,
      },
    },
    include: {
      clause: {
        include: {
          category: true,
        },
      },
    },
  });

  if (existing) {
    // Update existing link
    return await prisma.rfpTemplateClauseLink.update({
      where: { id: existing.id },
      data: { required },
      include: {
        clause: {
          include: {
            category: true,
          },
        },
      },
    }) as any as TemplateClauseLink;
  }

  // Create new link
  return await prisma.rfpTemplateClauseLink.create({
    data: {
      templateId,
      clauseId,
      required,
      createdById,
    },
    include: {
      clause: {
        include: {
          category: true,
        },
      },
    },
  }) as any as TemplateClauseLink;
}

/**
 * Unlink a clause from a template
 */
export async function unlinkClauseFromTemplate(
  templateId: string,
  clauseId: string
): Promise<void> {
  await prisma.rfpTemplateClauseLink.deleteMany({
    where: {
      templateId,
      clauseId,
    },
  });
}

/**
 * Get all clauses linked to a template
 */
export async function getTemplateClauses(templateId: string): Promise<TemplateClauseLink[]> {
  return await prisma.rfpTemplateClauseLink.findMany({
    where: { templateId },
    include: {
      clause: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      insertedAt: 'asc',
    },
  }) as any as TemplateClauseLink[];
}

// ============================================================================
// CLAUSE INJECTION & SNAPSHOT MANAGEMENT
// ============================================================================

/**
 * Inject clauses into template structure
 * Returns the template structure with clauses injected at designated insertion points
 */
export async function injectClausesIntoTemplate(
  templateStructure: any,
  templateId: string
): Promise<any> {
  // Get all linked clauses for this template
  const clauseLinks = await getTemplateClauses(templateId);
  
  if (clauseLinks.length === 0) {
    return templateStructure;
  }

  // Clone the structure to avoid mutation
  const injectedStructure = JSON.parse(JSON.stringify(templateStructure));

  // Group clauses by category
  const clausesByCategory = clauseLinks.reduce((acc, link) => {
    const categoryName = link.clause.category?.name || 'Other';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(link);
    return acc;
  }, {} as Record<string, TemplateClauseLink[]>);

  // Find the "Terms & Conditions" or "Legal" section in the structure
  // If not found, create one
  let termsSection = injectedStructure.sections?.find(
    (s: any) => s.title.toLowerCase().includes('terms') || 
                s.title.toLowerCase().includes('legal')
  );

  if (!termsSection) {
    // Create a new Terms & Conditions section
    termsSection = {
      id: `section-${Date.now()}`,
      title: 'Terms & Conditions',
      description: 'Standard terms, conditions, and clauses',
      order: injectedStructure.sections?.length || 0,
      subsections: [],
    };
    if (!injectedStructure.sections) injectedStructure.sections = [];
    injectedStructure.sections.push(termsSection);
  }

  // Inject clauses as subsections grouped by category
  Object.entries(clausesByCategory).forEach(([categoryName, links], categoryIndex) => {
    const subsection = {
      id: `subsection-clauses-${categoryIndex}`,
      title: categoryName,
      order: (termsSection.subsections?.length || 0) + categoryIndex,
      questions: links.map((link, index) => ({
        id: `clause-${link.clauseId}`,
        text: link.clause.title,
        description: link.clause.description,
        type: 'textarea',
        required: link.required || link.clause.isRequired,
        order: index,
        clauseId: link.clauseId,
        clauseBody: link.clause.body,
        clauseType: link.clause.clauseType,
      })),
    };
    
    if (!termsSection.subsections) termsSection.subsections = [];
    termsSection.subsections.push(subsection);
  });

  return injectedStructure;
}

/**
 * Create a snapshot of clauses for an RFP
 * This snapshot is stored with the RFP and represents the exact clauses
 * that were applied at template application time
 */
export async function createClausesSnapshot(templateId: string): Promise<any> {
  const clauseLinks = await getTemplateClauses(templateId);
  
  return {
    timestamp: new Date().toISOString(),
    templateId,
    clauses: clauseLinks.map(link => ({
      id: link.clauseId,
      title: link.clause.title,
      description: link.clause.description,
      body: link.clause.body,
      isRequired: link.required || link.clause.isRequired,
      clauseType: link.clause.clauseType,
      category: link.clause.category?.name || 'Other',
    })),
  };
}

/**
 * Apply template with clauses to an RFP
 * This updates the RFP with both the template structure and clause snapshots
 */
export async function applyTemplateWithClauses(
  rfpId: string,
  templateId: string
): Promise<void> {
  // Get the template
  const template = await prisma.rfpTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Create structure with injected clauses
  const injectedStructure = await injectClausesIntoTemplate(
    template.structureJson,
    templateId
  );

  // Create clauses snapshot
  const clausesSnapshot = await createClausesSnapshot(templateId);

  // Update the RFP
  await prisma.rFP.update({
    where: { id: rfpId },
    data: {
      templateId,
      appliedTemplateSnapshot: injectedStructure,
      appliedClausesSnapshot: clausesSnapshot,
    },
  });
}
