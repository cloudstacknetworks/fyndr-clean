// STEP 56: Company-Level RFP Master Template Library Service
import { prisma } from '@/lib/prisma';

/**
 * Interface for creating a new template
 */
export interface CreateTemplateInput {
  name: string;
  description?: string;
  companyId: string;
  visibility?: 'company' | 'private';
  category?: string;
  defaultTimeline?: any;
  defaultSections?: any;
  createdByUserId: string;
  initialContentJson: any;
}

/**
 * Interface for updating a template
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  visibility?: 'company' | 'private';
  category?: string;
  defaultTimeline?: any;
  defaultSections?: any;
  updatedByUserId: string;
  contentJson?: any;
}

/**
 * Interface for query filters
 */
export interface TemplateQueryFilters {
  companyId: string;
  userId: string;
  category?: string;
  visibility?: 'company' | 'private';
  includeDeleted?: boolean;
}

/**
 * Get all templates for a company
 * Filters by company, visibility, and deletion status
 */
export async function getTemplates(filters: TemplateQueryFilters) {
  const { companyId, userId, category, visibility, includeDeleted = false } = filters;

  const where: any = {
    companyId,
    isDeleted: includeDeleted ? undefined : false,
  };

  if (category) {
    where.category = category;
  }

  if (visibility) {
    where.visibility = visibility;
  } else {
    // Show both company templates and user's private templates
    where.OR = [
      { visibility: 'company' },
      { visibility: 'private', createdByUserId: userId }
    ];
  }

  const templates = await prisma.rFPTemplate.findMany({
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

  return templates;
}

/**
 * Get a single template by ID
 * Includes version history
 */
export async function getTemplateById(templateId: string, userId: string) {
  const template = await prisma.rFPTemplate.findUnique({
    where: { id: templateId },
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
        take: 10, // Last 10 versions
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

  if (!template) {
    throw new Error('Template not found');
  }

  // Check access permissions
  if (template.visibility === 'private' && template.createdByUserId !== userId) {
    throw new Error('Access denied: Template is private');
  }

  return template;
}

/**
 * Create a new template
 * Automatically creates version 1
 */
export async function createTemplate(input: CreateTemplateInput) {
  const {
    name,
    description,
    companyId,
    visibility = 'company',
    category,
    defaultTimeline,
    defaultSections,
    createdByUserId,
    initialContentJson,
  } = input;

  const template = await prisma.rFPTemplate.create({
    data: {
      name,
      description,
      companyId,
      visibility,
      category,
      defaultTimeline,
      defaultSections,
      createdByUserId,
      versions: {
        create: {
          versionNumber: 1,
          contentJson: initialContentJson,
          createdByUserId,
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
      versions: {
        orderBy: {
          versionNumber: 'desc',
        },
        take: 1,
      },
    },
  });

  return template;
}

/**
 * Update a template
 * Creates a new version if contentJson is provided
 */
export async function updateTemplate(templateId: string, input: UpdateTemplateInput) {
  const { contentJson, updatedByUserId, ...updateData } = input;

  // Check if template exists
  const existing = await prisma.rFPTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        orderBy: {
          versionNumber: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!existing) {
    throw new Error('Template not found');
  }

  // Update template metadata
  const template = await prisma.rFPTemplate.update({
    where: { id: templateId },
    data: updateData,
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

  // Create new version if content is provided
  if (contentJson) {
    const latestVersion = existing.versions[0];
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    await prisma.rFPTemplateVersion.create({
      data: {
        templateId,
        versionNumber: newVersionNumber,
        contentJson,
        createdByUserId: updatedByUserId,
      },
    });
  }

  return template;
}

/**
 * Soft delete a template
 */
export async function deleteTemplate(templateId: string, userId: string) {
  // Check if template exists and user has permission
  const template = await prisma.rFPTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (template.visibility === 'private' && template.createdByUserId !== userId) {
    throw new Error('Access denied: Cannot delete this template');
  }

  // Soft delete
  const updated = await prisma.rFPTemplate.update({
    where: { id: templateId },
    data: {
      isDeleted: true,
    },
  });

  return updated;
}

/**
 * Duplicate a template
 * Creates a new template with the latest version content
 */
export async function duplicateTemplate(
  templateId: string,
  userId: string,
  companyId: string | null,
  newName?: string
) {
  // Get original template with latest version
  const original = await prisma.rFPTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        orderBy: {
          versionNumber: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!original) {
    throw new Error('Template not found');
  }

  // Check access permissions
  if (original.visibility === 'private' && original.createdByUserId !== userId) {
    throw new Error('Access denied: Cannot duplicate this template');
  }

  const latestVersion = original.versions[0];
  if (!latestVersion) {
    throw new Error('Template has no versions');
  }

  // Use original template's companyId if not provided
  const targetCompanyId = companyId || original.companyId;

  // Create duplicate
  const duplicate = await createTemplate({
    name: newName || `${original.name} (Copy)`,
    description: original.description || undefined,
    companyId: targetCompanyId,
    visibility: 'private', // New duplicates are always private
    category: original.category || undefined,
    defaultTimeline: original.defaultTimeline || undefined,
    defaultSections: original.defaultSections || undefined,
    createdByUserId: userId,
    initialContentJson: latestVersion.contentJson,
  });

  return duplicate;
}

/**
 * Get template version history
 */
export async function getTemplateVersions(templateId: string, userId: string) {
  // Check template exists and user has access
  const template = await prisma.rFPTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (template.visibility === 'private' && template.createdByUserId !== userId) {
    throw new Error('Access denied: Template is private');
  }

  const versions = await prisma.rFPTemplateVersion.findMany({
    where: { templateId },
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
  });

  return versions;
}

/**
 * Get a specific template version
 */
export async function getTemplateVersion(
  templateId: string,
  versionNumber: number,
  userId: string
) {
  // Check template exists and user has access
  const template = await prisma.rFPTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (template.visibility === 'private' && template.createdByUserId !== userId) {
    throw new Error('Access denied: Template is private');
  }

  const version = await prisma.rFPTemplateVersion.findUnique({
    where: {
      templateId_versionNumber: {
        templateId,
        versionNumber,
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
    },
  });

  if (!version) {
    throw new Error('Version not found');
  }

  return version;
}
