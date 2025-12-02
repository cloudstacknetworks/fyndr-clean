/**
 * STEP 38A: RFP Template Engine Service
 * 
 * Core business logic for RFP template management:
 * - Loading templates from database
 * - Applying templates to RFPs
 * - Managing template structure and snapshots
 */

import { prisma } from '@/lib/prisma';
import { RfpTemplate, RfpTemplateCategory } from '@prisma/client';

// ================== TypeScript Types ==================

export type QuestionType = "text" | "textarea" | "number" | "date" | "select" | "multiselect";

export interface TemplateQuestion {
  id: string;
  question: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select/multiselect types
  order: number;
}

export interface TemplateSubsection {
  id: string;
  title: string;
  description?: string;
  questions: TemplateQuestion[];
  order: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  subsections: TemplateSubsection[];
  order: number;
}

export interface TemplateStructure {
  version: number;
  sections: TemplateSection[];
  metadata: {
    createdAt: string;
    lastModified: string;
  };
}

export interface AppliedTemplateSnapshot {
  templateId: string;
  templateTitle: string;
  templateVersion: number;
  appliedAt: string;
  structure: TemplateStructure;
}

// ================== Core Functions ==================

/**
 * Load a template from the database by ID
 * @param templateId - The ID of the template to load
 * @returns The template if found and active, null otherwise
 */
export async function loadTemplate(templateId: string): Promise<RfpTemplate | null> {
  try {
    const template = await prisma.rfpTemplate.findUnique({
      where: {
        id: templateId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return template;
  } catch (error) {
    console.error('[loadTemplate] Error loading template:', error);
    return null;
  }
}

/**
 * Apply a template to an RFP
 * @param rfpId - The ID of the RFP to apply the template to
 * @param templateId - The ID of the template to apply
 * @param userId - The ID of the user applying the template
 * @returns Result object with success status, updated RFP, and message
 */
export async function applyTemplateToRfp(
  rfpId: string,
  templateId: string,
  userId: string
): Promise<{ success: boolean; rfp?: any; message: string }> {
  try {
    // 1. Load RFP and validate it exists and belongs to user's company
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: { user: true },
    });

    if (!rfp) {
      return {
        success: false,
        message: 'RFP not found',
      };
    }

    if (rfp.userId !== userId) {
      return {
        success: false,
        message: 'Unauthorized: You do not own this RFP',
      };
    }

    // 2. Load template and validate it exists and is active
    const template = await loadTemplate(templateId);

    if (!template) {
      return {
        success: false,
        message: 'Template not found or is inactive',
      };
    }

    // 3. Create appliedTemplateSnapshot
    const snapshot: AppliedTemplateSnapshot = {
      templateId: template.id,
      templateTitle: template.title,
      templateVersion: template.version,
      appliedAt: new Date().toISOString(),
      structure: template.structureJson as unknown as TemplateStructure,
    };

    // 4. Update RFP with template information
    const updatedRfp = await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        templateId: template.id,
        appliedTemplateSnapshot: snapshot as any,
      },
    });

    // 5. Create ActivityLog entry
    await prisma.activityLog.create({
      data: {
        rfpId: rfpId,
        userId: userId,
        actorRole: 'BUYER',
        eventType: 'TEMPLATE_APPLIED',
        summary: `Applied template "${template.title}" to RFP "${rfp.title}"`,
        details: {
          templateId: template.id,
          templateTitle: template.title,
          templateVersion: template.version,
          rfpId: rfpId,
          rfpTitle: rfp.title,
        },
      },
    });

    return {
      success: true,
      rfp: updatedRfp,
      message: `Template "${template.title}" successfully applied to RFP`,
    };
  } catch (error) {
    console.error('[applyTemplateToRfp] Error applying template:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply template',
    };
  }
}

/**
 * Get all available templates with their categories
 * @param companyId - Optional company ID for company-specific templates (future use)
 * @returns Object with categories and templates arrays
 */
export async function getAvailableTemplates(companyId?: string): Promise<{
  categories: RfpTemplateCategory[];
  templates: RfpTemplate[];
}> {
  try {
    // Fetch all active templates with their categories
    const templates = await prisma.rfpTemplate.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: [
        { categoryId: 'asc' },
        { title: 'asc' },
      ],
    });

    // Fetch all categories that have active templates
    const categories = await prisma.rfpTemplateCategory.findMany({
      where: {
        templates: {
          some: {
            isActive: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      categories,
      templates,
    };
  } catch (error) {
    console.error('[getAvailableTemplates] Error fetching templates:', error);
    return {
      categories: [],
      templates: [],
    };
  }
}
