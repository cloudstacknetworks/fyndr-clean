/**
 * STEP 57: Company-Level Master Requirements Library
 * Backend Service - Complete Implementation
 * 
 * This service provides comprehensive functions for managing requirement blocks,
 * including CRUD operations, versioning, cloning, and insertion into RFPs/templates.
 */

import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';

// TypeScript Interfaces
export interface RequirementPayload {
  title: string;
  category: string;
  subcategory?: string;
  contentJson: {
    question: string;
    mustHave?: boolean;
    scoringType?: 'numeric' | 'weighted' | 'free-response';
    weight?: number;
    notes?: string;
  };
  visibility?: 'company' | 'private';
}

export interface RequirementFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  visibility?: 'company' | 'private';
}

/**
 * 1. List Requirements with Filters
 * Query all requirements for company where isArchived = false
 */
export async function listRequirements(
  companyId: string,
  userId: string,
  filters?: RequirementFilters
) {
  try {
    // Build where clause
    const where: any = {
      companyId,
      isArchived: false,
    };

    // Apply filters
    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters?.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Visibility rules: company requirements + user's private requirements
    if (filters?.visibility === 'private') {
      where.visibility = 'private';
      where.createdByUserId = userId;
    } else if (filters?.visibility === 'company') {
      where.visibility = 'company';
    } else {
      // Show both: company requirements + user's private requirements
      where.OR = [
        { visibility: 'company' },
        { visibility: 'private', createdByUserId: userId },
      ];
    }

    const requirements = await prisma.requirementBlock.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return requirements;
  } catch (error) {
    console.error('[listRequirements] Error:', error);
    throw new Error('Failed to list requirements');
  }
}

/**
 * 2. Get Requirement with All Versions
 * Fetch requirement with all versions ordered by versionNumber desc
 */
export async function getRequirement(id: string, companyId: string, userId: string) {
  try {
    const requirement = await prisma.requirementBlock.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: {
            versionNumber: 'desc',
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    // Enforce company scoping
    if (requirement.companyId !== companyId) {
      throw new Error('Access denied: Requirement belongs to different company');
    }

    // Check visibility permissions
    if (requirement.visibility === 'private' && requirement.createdByUserId !== userId) {
      throw new Error('Access denied: Private requirement');
    }

    return requirement;
  } catch (error) {
    console.error('[getRequirement] Error:', error);
    throw error;
  }
}

/**
 * 3. Create Requirement
 * Create new requirement with initial version
 */
export async function createRequirement(
  payload: RequirementPayload,
  companyId: string,
  userId: string
) {
  try {
    const requirement = await prisma.requirementBlock.create({
      data: {
        companyId,
        createdByUserId: userId,
        title: payload.title,
        category: payload.category,
        subcategory: payload.subcategory || null,
        contentJson: payload.contentJson,
        visibility: payload.visibility || 'company',
        versions: {
          create: {
            versionNumber: 1,
            contentJson: payload.contentJson,
            createdByUserId: userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
    });

    // Log activity
    await logActivity({
      eventType: EVENT_TYPES.REQUIREMENT_CREATED,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      rfpId: undefined,
      supplierResponseId: undefined,
      supplierContactId: undefined,
      summary: `Requirement created: ${requirement.title}`,
      details: {
        requirementId: requirement.id,
        title: requirement.title,
        category: requirement.category,
        visibility: requirement.visibility,
      },
    });

    return requirement;
  } catch (error) {
    console.error('[createRequirement] Error:', error);
    throw new Error('Failed to create requirement');
  }
}

/**
 * 4. Update Requirement
 * Update requirement fields and create new version
 */
export async function updateRequirement(
  id: string,
  payload: Partial<RequirementPayload>,
  companyId: string,
  userId: string
) {
  try {
    // Fetch requirement and verify company scoping
    const existing = await prisma.requirementBlock.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new Error('Requirement not found');
    }

    if (existing.companyId !== companyId) {
      throw new Error('Access denied: Requirement belongs to different company');
    }

    // Get latest version number
    const latestVersionNumber = existing.versions[0]?.versionNumber || 0;
    const newVersionNumber = latestVersionNumber + 1;

    // Prepare updated data
    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.subcategory !== undefined) updateData.subcategory = payload.subcategory;
    if (payload.visibility !== undefined) updateData.visibility = payload.visibility;
    if (payload.contentJson !== undefined) updateData.contentJson = payload.contentJson;

    // Update requirement and create new version
    const requirement = await prisma.requirementBlock.update({
      where: { id },
      data: {
        ...updateData,
        versions: {
          create: {
            versionNumber: newVersionNumber,
            contentJson: payload.contentJson || existing.contentJson,
            createdByUserId: userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
    });

    // Log activities
    await logActivity({
      eventType: EVENT_TYPES.REQUIREMENT_UPDATED,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      rfpId: undefined,
      supplierResponseId: undefined,
      supplierContactId: undefined,
      summary: `Requirement updated: ${requirement.title}`,
      details: {
        requirementId: requirement.id,
        updatedFields: Object.keys(updateData),
      },
    });

    await logActivity({
      eventType: EVENT_TYPES.REQUIREMENT_VERSION_CREATED,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      rfpId: undefined,
      supplierResponseId: undefined,
      supplierContactId: undefined,
      summary: `Requirement version ${newVersionNumber} created: ${requirement.title}`,
      details: {
        requirementId: requirement.id,
        versionNumber: newVersionNumber,
      },
    });

    return requirement;
  } catch (error) {
    console.error('[updateRequirement] Error:', error);
    throw error;
  }
}

/**
 * 5. Archive Requirement (Soft Delete)
 * Set isArchived = true
 */
export async function archiveRequirement(id: string, companyId: string, userId: string) {
  try {
    const requirement = await prisma.requirementBlock.findUnique({
      where: { id },
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    if (requirement.companyId !== companyId) {
      throw new Error('Access denied: Requirement belongs to different company');
    }

    await prisma.requirementBlock.update({
      where: { id },
      data: { isArchived: true },
    });

    // Log activity
    await logActivity({
      eventType: EVENT_TYPES.REQUIREMENT_ARCHIVED,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      rfpId: undefined,
      supplierResponseId: undefined,
      supplierContactId: undefined,
      summary: `Requirement archived: ${requirement.title}`,
      details: {
        requirementId: requirement.id,
        title: requirement.title,
      },
    });

    return { success: true, message: 'Requirement archived successfully' };
  } catch (error) {
    console.error('[archiveRequirement] Error:', error);
    throw error;
  }
}

/**
 * 6. Clone Requirement
 * Create new requirement with "(Copy)" suffix
 */
export async function cloneRequirement(id: string, companyId: string, userId: string) {
  try {
    // Fetch source requirement with latest version
    const source = await prisma.requirementBlock.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!source) {
      throw new Error('Source requirement not found');
    }

    if (source.companyId !== companyId) {
      throw new Error('Access denied: Requirement belongs to different company');
    }

    // Get latest version content
    const latestContent = source.versions[0]?.contentJson || source.contentJson;

    // Create cloned requirement
    const cloned = await prisma.requirementBlock.create({
      data: {
        companyId,
        createdByUserId: userId,
        title: `${source.title} (Copy)`,
        category: source.category,
        subcategory: source.subcategory,
        contentJson: latestContent as any,
        visibility: source.visibility,
        versions: {
          create: {
            versionNumber: 1,
            contentJson: latestContent as any,
            createdByUserId: userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
    });

    // Log activity
    await logActivity({
      eventType: EVENT_TYPES.REQUIREMENT_CLONED,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      rfpId: undefined,
      supplierResponseId: undefined,
      supplierContactId: undefined,
      summary: `Requirement cloned: ${source.title} → ${cloned.title}`,
      details: {
        sourceRequirementId: source.id,
        clonedRequirementId: cloned.id,
        sourceTitle: source.title,
        clonedTitle: cloned.title,
      },
    });

    return cloned;
  } catch (error) {
    console.error('[cloneRequirement] Error:', error);
    throw error;
  }
}

/**
 * 7. List Versions
 * Fetch all versions for requirement ordered by versionNumber desc
 */
export async function listVersions(requirementId: string, companyId: string) {
  try {
    const requirement = await prisma.requirementBlock.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    if (requirement.companyId !== companyId) {
      throw new Error('Access denied: Requirement belongs to different company');
    }

    const versions = await prisma.requirementBlockVersion.findMany({
      where: { requirementBlockId: requirementId },
      orderBy: { versionNumber: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return versions;
  } catch (error) {
    console.error('[listVersions] Error:', error);
    throw error;
  }
}

/**
 * 8. Insert Requirement Into RFP
 * Append requirement to RFP's requirementGroups (FROZEN COPY)
 */
export async function insertRequirementIntoRfp(
  rfpId: string,
  requirementId: string,
  companyId: string,
  userId: string
) {
  try {
    // Fetch requirement with latest version
    const requirement = await prisma.requirementBlock.findUnique({
      where: { id: requirementId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    if (requirement.companyId !== companyId) {
      throw new Error('Access denied: Requirement belongs to different company');
    }

    // Fetch RFP and verify company scoping
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.userId !== userId) {
      throw new Error('Access denied: Not RFP owner');
    }

    // Extract contentJson from latest version
    const latestContent = requirement.versions[0]?.contentJson || requirement.contentJson;

    // Structure requirement for RFP
    const requirementEntry = {
      id: requirement.id,
      title: requirement.title,
      category: requirement.category,
      subcategory: requirement.subcategory,
      question: (latestContent as any).question,
      mustHave: (latestContent as any).mustHave || false,
      scoringType: (latestContent as any).scoringType || 'numeric',
      weight: (latestContent as any).weight || 1,
      notes: (latestContent as any).notes || '',
      insertedAt: new Date().toISOString(),
    };

    // Append to RFP's requirementGroups
    const currentGroups = (rfp.requirementGroups as any) || [];
    const updatedGroups = [...currentGroups, requirementEntry];

    await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        requirementGroups: updatedGroups as any,
      },
    });

    // Log activity
    await logActivity({
      eventType: EVENT_TYPES.REQUIREMENT_INSERTED_INTO_RFP,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      rfpId,
      supplierResponseId: undefined,
      supplierContactId: undefined,
      summary: `Requirement inserted into RFP: ${requirement.title} → ${rfp.title}`,
      details: {
        requirementId: requirement.id,
        rfpId,
        requirementTitle: requirement.title,
        rfpTitle: rfp.title,
      },
    });

    return { success: true, rfp, requirement: requirementEntry };
  } catch (error) {
    console.error('[insertRequirementIntoRfp] Error:', error);
    throw error;
  }
}

/**
 * 9. Insert Requirement Into Template
 * Append requirement to template's defaultSections
 */
export async function insertRequirementIntoTemplate(
  templateId: string,
  requirementId: string,
  companyId: string,
  userId: string
) {
  try {
    // Fetch requirement with latest version
    const requirement = await prisma.requirementBlock.findUnique({
      where: { id: requirementId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    if (requirement.companyId !== companyId) {
      throw new Error('Access denied: Requirement belongs to different company');
    }

    // Fetch template and verify company scoping
    const template = await prisma.rFPTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.companyId !== companyId) {
      throw new Error('Access denied: Template belongs to different company');
    }

    // Extract contentJson from latest version
    const latestContent = requirement.versions[0]?.contentJson || requirement.contentJson;

    // Structure requirement for template
    const requirementEntry = {
      id: requirement.id,
      title: requirement.title,
      category: requirement.category,
      subcategory: requirement.subcategory,
      question: (latestContent as any).question,
      mustHave: (latestContent as any).mustHave || false,
      scoringType: (latestContent as any).scoringType || 'numeric',
      weight: (latestContent as any).weight || 1,
      notes: (latestContent as any).notes || '',
      insertedAt: new Date().toISOString(),
    };

    // Append to template's defaultSections
    const currentSections = (template.defaultSections as any) || [];
    const updatedSections = [...currentSections, requirementEntry];

    await prisma.rFPTemplate.update({
      where: { id: templateId },
      data: {
        defaultSections: updatedSections as any,
      },
    });

    // Log activity
    await logActivity({
      eventType: EVENT_TYPES.REQUIREMENT_INSERTED_INTO_TEMPLATE,
      actorRole: ACTOR_ROLES.BUYER,
      userId,
      rfpId: undefined,
      supplierResponseId: undefined,
      supplierContactId: undefined,
      summary: `Requirement inserted into template: ${requirement.title} → ${template.name}`,
      details: {
        requirementId: requirement.id,
        templateId,
        requirementTitle: requirement.title,
        templateName: template.name,
      },
    });

    return { success: true, template, requirement: requirementEntry };
  } catch (error) {
    console.error('[insertRequirementIntoTemplate] Error:', error);
    throw error;
  }
}

/**
 * 10. Bulk Insert Requirements
 * Insert multiple requirements into RFP or Template
 */
export async function bulkInsertRequirements(
  targetId: string,
  requirementIds: string[],
  targetType: 'rfp' | 'template',
  companyId: string,
  userId: string
) {
  try {
    if (!['rfp', 'template'].includes(targetType)) {
      throw new Error('Invalid targetType. Must be "rfp" or "template"');
    }

    if (!requirementIds || requirementIds.length === 0) {
      throw new Error('No requirement IDs provided');
    }

    // Fetch all requirements with latest versions
    const requirements = await prisma.requirementBlock.findMany({
      where: {
        id: { in: requirementIds },
        companyId,
        isArchived: false,
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (requirements.length !== requirementIds.length) {
      throw new Error('Some requirements not found or access denied');
    }

    if (targetType === 'rfp') {
      // Insert into RFP
      const rfp = await prisma.rFP.findUnique({ where: { id: targetId } });
      if (!rfp) throw new Error('RFP not found');
      if (rfp.userId !== userId) throw new Error('Access denied: Not RFP owner');

      const currentGroups = (rfp.requirementGroups as any) || [];
      const newEntries = requirements.map((req) => {
        const latestContent = req.versions[0]?.contentJson || req.contentJson;
        return {
          id: req.id,
          title: req.title,
          category: req.category,
          subcategory: req.subcategory,
          question: (latestContent as any).question,
          mustHave: (latestContent as any).mustHave || false,
          scoringType: (latestContent as any).scoringType || 'numeric',
          weight: (latestContent as any).weight || 1,
          notes: (latestContent as any).notes || '',
          insertedAt: new Date().toISOString(),
        };
      });

      await prisma.rFP.update({
        where: { id: targetId },
        data: { requirementGroups: [...currentGroups, ...newEntries] as any },
      });

      // Log activities
      for (const req of requirements) {
        await logActivity({
          eventType: EVENT_TYPES.REQUIREMENT_INSERTED_INTO_RFP,
          actorRole: ACTOR_ROLES.BUYER,
          userId,
          rfpId: targetId,
          supplierResponseId: undefined,
          supplierContactId: undefined,
          summary: `Requirement bulk-inserted into RFP: ${req.title}`,
          details: { requirementId: req.id, rfpId: targetId },
        });
      }

      return { success: true, count: requirements.length, target: rfp };
    } else {
      // Insert into Template
      const template = await prisma.rFPTemplate.findUnique({ where: { id: targetId } });
      if (!template) throw new Error('Template not found');
      if (template.companyId !== companyId) throw new Error('Access denied: Template belongs to different company');

      const currentSections = (template.defaultSections as any) || [];
      const newEntries = requirements.map((req) => {
        const latestContent = req.versions[0]?.contentJson || req.contentJson;
        return {
          id: req.id,
          title: req.title,
          category: req.category,
          subcategory: req.subcategory,
          question: (latestContent as any).question,
          mustHave: (latestContent as any).mustHave || false,
          scoringType: (latestContent as any).scoringType || 'numeric',
          weight: (latestContent as any).weight || 1,
          notes: (latestContent as any).notes || '',
          insertedAt: new Date().toISOString(),
        };
      });

      await prisma.rFPTemplate.update({
        where: { id: targetId },
        data: { defaultSections: [...currentSections, ...newEntries] as any },
      });

      // Log activities
      for (const req of requirements) {
        await logActivity({
          eventType: EVENT_TYPES.REQUIREMENT_INSERTED_INTO_TEMPLATE,
          actorRole: ACTOR_ROLES.BUYER,
          userId,
          rfpId: undefined,
          supplierResponseId: undefined,
          supplierContactId: undefined,
          summary: `Requirement bulk-inserted into template: ${req.title}`,
          details: { requirementId: req.id, templateId: targetId },
        });
      }

      return { success: true, count: requirements.length, target: template };
    }
  } catch (error) {
    console.error('[bulkInsertRequirements] Error:', error);
    throw error;
  }
}
