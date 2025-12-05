import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

/**
 * TypeScript Interfaces for Scoring Matrix Templates
 */
export interface ScoringCategory {
  categoryName: string;
  weight: number;
  scoringType: 'numeric' | 'weighted' | 'qualitative' | 'pass/fail';
  notes?: string;
}

export interface ScoringTemplatePayload {
  title: string;
  description?: string;
  categoriesJson: ScoringCategory[];
  requirementsJson?: string[]; // Array of requirementIds
  visibility?: 'company' | 'private';
}

export interface ScoringTemplateFilters {
  search?: string;
  visibility?: 'company' | 'private';
}

/**
 * Validates that category weights sum to 100%
 */
function validateCategoryWeights(categories: ScoringCategory[]): boolean {
  const total = categories.reduce((sum, cat) => sum + cat.weight, 0);
  return Math.abs(total - 100) < 0.01; // Allow for floating point precision
}

/**
 * Normalizes category weights to sum to 100%
 */
function normalizeCategoryWeights(categories: ScoringCategory[]): ScoringCategory[] {
  const total = categories.reduce((sum, cat) => sum + cat.weight, 0);
  if (total === 0) {
    // Equal distribution if all weights are 0
    const equalWeight = 100 / categories.length;
    return categories.map(cat => ({ ...cat, weight: equalWeight }));
  }
  
  return categories.map(cat => ({
    ...cat,
    weight: (cat.weight / total) * 100
  }));
}

/**
 * 1. List all scoring templates for a company
 */
export async function listTemplates(
  companyId: string,
  userId: string,
  filters?: ScoringTemplateFilters
) {
  try {
    const where: any = {
      companyId,
      isArchived: false,
      OR: [
        { visibility: 'company' },
        { visibility: 'private', createdByUserId: userId }
      ]
    };

    if (filters?.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive'
      };
    }

    if (filters?.visibility) {
      where.visibility = filters.visibility;
      if (filters.visibility === 'private') {
        where.createdByUserId = userId;
      }
    }

    const templates = await prisma.scoringMatrixTemplate.findMany({
      where,
      include: {
        _count: {
          select: { versions: true }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return templates.map(template => ({
      ...template,
      versionCount: template._count.versions,
      categoryCount: Array.isArray(template.categoriesJson) 
        ? (template.categoriesJson as unknown as ScoringCategory[]).length 
        : 0
    }));
  } catch (error) {
    console.error('Error listing templates:', error);
    throw new Error('Failed to list scoring templates');
  }
}

/**
 * 2. Get a single template with all versions
 */
export async function getTemplate(id: string, companyId: string, userId: string) {
  try {
    const template = await prisma.scoringMatrixTemplate.findFirst({
      where: {
        id,
        companyId,
        OR: [
          { visibility: 'company' },
          { visibility: 'private', createdByUserId: userId }
        ]
      },
      include: {
        versions: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { versionNumber: 'desc' }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    return template;
  } catch (error) {
    console.error('Error getting template:', error);
    throw error;
  }
}

/**
 * 3. Create a new scoring template
 */
export async function createTemplate(
  payload: ScoringTemplatePayload,
  companyId: string,
  userId: string
) {
  try {
    // Validate categories
    if (!Array.isArray(payload.categoriesJson) || payload.categoriesJson.length === 0) {
      throw new Error('At least one category is required');
    }

    // Normalize weights to ensure they sum to 100%
    const normalizedCategories = normalizeCategoryWeights(payload.categoriesJson);

    // Create template with initial version
    const template = await prisma.scoringMatrixTemplate.create({
      data: {
        companyId,
        createdByUserId: userId,
        title: payload.title,
        description: payload.description,
        categoriesJson: normalizedCategories as any,
        requirementsJson: payload.requirementsJson || [],
        visibility: payload.visibility || 'company',
        versions: {
          create: {
            versionNumber: 1,
            categoriesJson: normalizedCategories as any,
            requirementsJson: payload.requirementsJson || [],
            createdByUserId: userId
          }
        }
      },
      include: {
        versions: true
      }
    });

    // Log activity
    await logActivity({
      eventType: EVENT_TYPES.SCORING_TEMPLATE_CREATED,
      userId,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Created scoring template: ${payload.title}`,
      details: {
        templateId: template.id,
        title: payload.title,
        categoryCount: normalizedCategories.length,
        visibility: payload.visibility || 'company'
      }
    });

    return template;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * 4. Update a scoring template (creates new version)
 */
export async function updateTemplate(
  id: string,
  payload: Partial<ScoringTemplatePayload>,
  companyId: string,
  userId: string
) {
  try {
    // Fetch existing template
    const existing = await prisma.scoringMatrixTemplate.findFirst({
      where: {
        id,
        companyId,
        OR: [
          { visibility: 'company' },
          { visibility: 'private', createdByUserId: userId }
        ]
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!existing) {
      throw new Error('Template not found or access denied');
    }

    // Prepare updated data
    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.visibility !== undefined) updateData.visibility = payload.visibility;

    // Handle categories update
    let newCategoriesJson: any = existing.categoriesJson;
    if (payload.categoriesJson) {
      const normalizedCategories = normalizeCategoryWeights(payload.categoriesJson);
      newCategoriesJson = normalizedCategories as any;
      updateData.categoriesJson = normalizedCategories as any;
    }

    // Handle requirements update
    let newRequirementsJson = existing.requirementsJson;
    if (payload.requirementsJson !== undefined) {
      newRequirementsJson = payload.requirementsJson;
      updateData.requirementsJson = payload.requirementsJson;
    }

    // Get latest version number
    const latestVersion = existing.versions[0];
    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Update template and create new version
    const updated = await prisma.scoringMatrixTemplate.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        versions: {
          create: {
            versionNumber: newVersionNumber,
            categoriesJson: newCategoriesJson as any,
            requirementsJson: newRequirementsJson as any,
            createdByUserId: userId
          }
        }
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    // Log activities
    await logActivity({
      eventType: EVENT_TYPES.SCORING_TEMPLATE_UPDATED,
      userId,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Updated scoring template: ${updated.title}`,
      details: {
        templateId: id,
        title: updated.title,
        updatedFields: Object.keys(updateData)
      }
    });

    await logActivity({
      eventType: EVENT_TYPES.SCORING_TEMPLATE_VERSION_CREATED,
      userId,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Created version ${newVersionNumber} of template: ${updated.title}`,
      details: {
        templateId: id,
        versionNumber: newVersionNumber
      }
    });

    return updated;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * 5. Archive a scoring template (soft delete)
 */
export async function archiveTemplate(id: string, companyId: string, userId: string) {
  try {
    const template = await prisma.scoringMatrixTemplate.findFirst({
      where: {
        id,
        companyId,
        OR: [
          { visibility: 'company' },
          { visibility: 'private', createdByUserId: userId }
        ]
      }
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    await prisma.scoringMatrixTemplate.update({
      where: { id },
      data: { isArchived: true }
    });

    await logActivity({
      eventType: EVENT_TYPES.SCORING_TEMPLATE_ARCHIVED,
      userId,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Archived scoring template: ${template.title}`,
      details: {
        templateId: id,
        title: template.title
      }
    });

    return { success: true, message: 'Template archived successfully' };
  } catch (error) {
    console.error('Error archiving template:', error);
    throw error;
  }
}

/**
 * 6. Clone a scoring template
 */
export async function cloneTemplate(id: string, companyId: string, userId: string) {
  try {
    const source = await prisma.scoringMatrixTemplate.findFirst({
      where: {
        id,
        companyId,
        OR: [
          { visibility: 'company' },
          { visibility: 'private', createdByUserId: userId }
        ]
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!source) {
      throw new Error('Source template not found or access denied');
    }

    const latestVersion = source.versions[0];

    const cloned = await prisma.scoringMatrixTemplate.create({
      data: {
        companyId,
        createdByUserId: userId,
        title: `${source.title} (Copy)`,
        description: source.description,
        categoriesJson: latestVersion.categoriesJson as any,
        requirementsJson: (latestVersion.requirementsJson || []) as any,
        visibility: source.visibility,
        versions: {
          create: {
            versionNumber: 1,
            categoriesJson: latestVersion.categoriesJson as any,
            requirementsJson: (latestVersion.requirementsJson || []) as any,
            createdByUserId: userId
          }
        }
      },
      include: {
        versions: true
      }
    });

    await logActivity({
      eventType: EVENT_TYPES.SCORING_TEMPLATE_CLONED,
      userId,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Cloned scoring template: ${source.title}`,
      details: {
        sourceTemplateId: id,
        newTemplateId: cloned.id,
        title: cloned.title
      }
    });

    return cloned;
  } catch (error) {
    console.error('Error cloning template:', error);
    throw error;
  }
}

/**
 * 7. List all versions of a template
 */
export async function listVersions(templateId: string, companyId: string, userId: string) {
  try {
    const template = await prisma.scoringMatrixTemplate.findFirst({
      where: {
        id: templateId,
        companyId,
        OR: [
          { visibility: 'company' },
          { visibility: 'private', createdByUserId: userId }
        ]
      }
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    const versions = await prisma.scoringMatrixTemplateVersion.findMany({
      where: { templateId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { versionNumber: 'desc' }
    });

    return versions;
  } catch (error) {
    console.error('Error listing versions:', error);
    throw error;
  }
}

/**
 * 8. Insert template into RFP (frozen copy)
 * RFPs store frozen copy of scoring matrix. No automatic updates if template changes.
 * Buyer must manually re-import to update.
 */
export async function insertTemplateIntoRfp(
  rfpId: string,
  templateId: string,
  companyId: string,
  userId: string
) {
  try {
    // Fetch template with latest version
    const template = await prisma.scoringMatrixTemplate.findFirst({
      where: {
        id: templateId,
        companyId,
        OR: [
          { visibility: 'company' },
          { visibility: 'private', createdByUserId: userId }
        ]
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    // Fetch RFP and verify ownership
    const rfp = await prisma.rFP.findFirst({
      where: {
        id: rfpId,
        userId // Ensure RFP belongs to the user
      }
    });

    if (!rfp) {
      throw new Error('RFP not found or access denied');
    }

    const latestVersion = template.versions[0];
    const categoriesJson = latestVersion.categoriesJson as unknown as ScoringCategory[];
    const requirementsJson = latestVersion.requirementsJson as unknown as string[] | null;

    // Expand requirements if they are IDs
    const expandedCategories = await Promise.all(
      categoriesJson.map(async (category) => {
        let requirements: any[] = [];
        
        if (requirementsJson && Array.isArray(requirementsJson) && requirementsJson.length > 0) {
          // Fetch requirement blocks
          const requirementBlocks = await prisma.requirementBlock.findMany({
            where: {
              id: { in: requirementsJson },
              companyId,
              isArchived: false
            },
            include: {
              versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1
              }
            }
          });

          // Expand into frozen copies
          requirements = requirementBlocks.map(block => {
            const content = block.versions[0]?.contentJson as any || {};
            return {
              id: block.id,
              title: block.title,
              category: block.category,
              subcategory: block.subcategory,
              question: content.question || '',
              mustHave: content.mustHave || false,
              scoringType: content.scoringType || 'numeric',
              weight: content.weight || 0,
              notes: content.notes || ''
            };
          });
        }

        return {
          ...category,
          requirements
        };
      })
    );

    // Normalize weights
    const normalizedCategories = normalizeCategoryWeights(expandedCategories as ScoringCategory[]);

    // Generate snapshot
    const scoringMatrixSnapshot = {
      categories: normalizedCategories,
      templateId: templateId,
      templateVersion: latestVersion.versionNumber,
      createdAt: new Date().toISOString()
    };

    // Update RFP
    const updatedRfp = await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        scoringMatrixSnapshot: scoringMatrixSnapshot as any,
        scoringMatrixTemplateId: templateId,
        scoringMatrixTemplateVersion: latestVersion.versionNumber
      }
    });

    await logActivity({
      eventType: EVENT_TYPES.SCORING_TEMPLATE_INSERTED_INTO_RFP,
      userId,
      actorRole: ACTOR_ROLES.BUYER,
      rfpId,
      summary: `Inserted scoring template "${template.title}" into RFP`,
      details: {
        rfpId,
        templateId,
        templateTitle: template.title,
        versionNumber: latestVersion.versionNumber,
        categoryCount: normalizedCategories.length
      }
    });

    return { success: true, rfp: updatedRfp };
  } catch (error) {
    console.error('Error inserting template into RFP:', error);
    throw error;
  }
}

/**
 * 9. Insert template into RFP Template (reference)
 * RFP Templates store reference to scoring template. Manual sync to latest version supported.
 */
export async function insertTemplateIntoRfpTemplate(
  rfpTemplateId: string,
  templateId: string,
  companyId: string,
  userId: string
) {
  try {
    // Fetch scoring template
    const scoringTemplate = await prisma.scoringMatrixTemplate.findFirst({
      where: {
        id: templateId,
        companyId,
        OR: [
          { visibility: 'company' },
          { visibility: 'private', createdByUserId: userId }
        ]
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!scoringTemplate) {
      throw new Error('Scoring template not found or access denied');
    }

    // Fetch RFP template and verify ownership
    const rfpTemplate = await prisma.rFPTemplate.findFirst({
      where: {
        id: rfpTemplateId,
        companyId
      }
    });

    if (!rfpTemplate) {
      throw new Error('RFP template not found or access denied');
    }

    const latestVersion = scoringTemplate.versions[0];

    // Create reference structure
    const scoringTemplateReference = {
      scoringTemplateId: templateId,
      scoringTemplateVersion: latestVersion.versionNumber,
      allowSync: true,
      insertedAt: new Date().toISOString()
    };

    // Update RFP template's defaultSections with scoring reference
    const currentSections = (rfpTemplate.defaultSections as any) || {};
    const updatedSections = {
      ...currentSections,
      scoringMatrixTemplate: scoringTemplateReference
    };

    await prisma.rFPTemplate.update({
      where: { id: rfpTemplateId },
      data: {
        defaultSections: updatedSections as any
      }
    });

    await logActivity({
      eventType: EVENT_TYPES.SCORING_TEMPLATE_INSERTED_INTO_RFP_TEMPLATE,
      userId,
      actorRole: ACTOR_ROLES.BUYER,
      summary: `Linked scoring template "${scoringTemplate.title}" to RFP template`,
      details: {
        rfpTemplateId,
        templateId,
        templateTitle: scoringTemplate.title,
        versionNumber: latestVersion.versionNumber
      }
    });

    return { success: true, message: 'Scoring template linked to RFP template successfully' };
  } catch (error) {
    console.error('Error inserting template into RFP template:', error);
    throw error;
  }
}
