/**
 * lib/rfp-templates/template-editor.ts
 * 
 * STEP 38B: Template Editor Engine
 * 
 * Core logic for editing RFP templates:
 * - Add/remove/reorder sections and subsections
 * - Add/remove/modify questions
 * - Version management
 * - Change tracking and audit trail
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  subsections?: TemplateSubsection[];
}

export interface TemplateSubsection {
  id: string;
  title: string;
  order: number;
  questions?: TemplateQuestion[];
}

export interface TemplateQuestion {
  id: string;
  text: string;
  description?: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'file';
  required: boolean;
  order: number;
  options?: string[];
  // Clause-specific fields
  clauseId?: string;
  clauseBody?: string;
  clauseType?: string;
}

export interface TemplateStructure {
  sections: TemplateSection[];
}

export interface EditTemplateInput {
  title?: string;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
}

// ============================================================================
// TEMPLATE STRUCTURE OPERATIONS
// ============================================================================

/**
 * Get the editable structure of a template
 * Returns sectionsJson if available, otherwise structureJson
 */
export async function getTemplateStructure(templateId: string): Promise<TemplateStructure> {
  const template = await prisma.rfpTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Prefer sectionsJson (editable version) over structureJson
  const structure = template.sectionsJson || template.structureJson;
  
  if (!structure || typeof structure !== 'object') {
    return { sections: [] };
  }

  return structure as unknown as TemplateStructure;
}

/**
 * Save template structure changes
 * Updates both sectionsJson and structureJson, increments version
 */
export async function saveTemplateStructure(
  templateId: string,
  structure: TemplateStructure,
  userId: string
): Promise<void> {
  const template = await prisma.rfpTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (!template.isEditable) {
    throw new Error('This template is locked and cannot be edited');
  }

  // Update the template
  await prisma.rfpTemplate.update({
    where: { id: templateId },
    data: {
      sectionsJson: structure as any,
      structureJson: structure as any,  // Keep both in sync
      version: template.version + 1,
      lastEditedById: userId,
      updatedAt: new Date(),
    },
  });
}

// ============================================================================
// SECTION OPERATIONS
// ============================================================================

/**
 * Add a new section to the template
 */
export async function addSection(
  templateId: string,
  title: string,
  description: string | undefined,
  userId: string,
  order?: number
): Promise<TemplateSection> {
  const structure = await getTemplateStructure(templateId);

  const newSection: TemplateSection = {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    order: order ?? structure.sections.length,
    subsections: [],
  };

  structure.sections.push(newSection);
  
  // Re-order sections if necessary
  structure.sections.sort((a, b) => a.order - b.order);

  await saveTemplateStructure(templateId, structure, userId);

  return newSection;
}

/**
 * Update an existing section
 */
export async function updateSection(
  templateId: string,
  sectionId: string,
  updates: { title?: string; description?: string; order?: number },
  userId: string
): Promise<void> {
  const structure = await getTemplateStructure(templateId);

  const section = structure.sections.find(s => s.id === sectionId);
  if (!section) {
    throw new Error('Section not found');
  }

  if (updates.title !== undefined) section.title = updates.title;
  if (updates.description !== undefined) section.description = updates.description;
  if (updates.order !== undefined) section.order = updates.order;

  // Re-order sections if order changed
  if (updates.order !== undefined) {
    structure.sections.sort((a, b) => a.order - b.order);
  }

  await saveTemplateStructure(templateId, structure, userId);
}

/**
 * Delete a section from the template
 */
export async function deleteSection(
  templateId: string,
  sectionId: string,
  userId: string
): Promise<void> {
  const structure = await getTemplateStructure(templateId);

  const sectionIndex = structure.sections.findIndex(s => s.id === sectionId);
  if (sectionIndex === -1) {
    throw new Error('Section not found');
  }

  structure.sections.splice(sectionIndex, 1);

  // Reorder remaining sections
  structure.sections.forEach((s, idx) => {
    s.order = idx;
  });

  await saveTemplateStructure(templateId, structure, userId);
}

// ============================================================================
// SUBSECTION OPERATIONS
// ============================================================================

/**
 * Add a new subsection to a section
 */
export async function addSubsection(
  templateId: string,
  sectionId: string,
  title: string,
  userId: string,
  order?: number
): Promise<TemplateSubsection> {
  const structure = await getTemplateStructure(templateId);

  const section = structure.sections.find(s => s.id === sectionId);
  if (!section) {
    throw new Error('Section not found');
  }

  if (!section.subsections) section.subsections = [];

  const newSubsection: TemplateSubsection = {
    id: `subsection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    order: order ?? section.subsections.length,
    questions: [],
  };

  section.subsections.push(newSubsection);
  section.subsections.sort((a, b) => a.order - b.order);

  await saveTemplateStructure(templateId, structure, userId);

  return newSubsection;
}

/**
 * Update an existing subsection
 */
export async function updateSubsection(
  templateId: string,
  sectionId: string,
  subsectionId: string,
  updates: { title?: string; order?: number },
  userId: string
): Promise<void> {
  const structure = await getTemplateStructure(templateId);

  const section = structure.sections.find(s => s.id === sectionId);
  if (!section || !section.subsections) {
    throw new Error('Section not found');
  }

  const subsection = section.subsections.find(ss => ss.id === subsectionId);
  if (!subsection) {
    throw new Error('Subsection not found');
  }

  if (updates.title !== undefined) subsection.title = updates.title;
  if (updates.order !== undefined) subsection.order = updates.order;

  if (updates.order !== undefined) {
    section.subsections.sort((a, b) => a.order - b.order);
  }

  await saveTemplateStructure(templateId, structure, userId);
}

/**
 * Delete a subsection
 */
export async function deleteSubsection(
  templateId: string,
  sectionId: string,
  subsectionId: string,
  userId: string
): Promise<void> {
  const structure = await getTemplateStructure(templateId);

  const section = structure.sections.find(s => s.id === sectionId);
  if (!section || !section.subsections) {
    throw new Error('Section not found');
  }

  const subsectionIndex = section.subsections.findIndex(ss => ss.id === subsectionId);
  if (subsectionIndex === -1) {
    throw new Error('Subsection not found');
  }

  section.subsections.splice(subsectionIndex, 1);
  section.subsections.forEach((ss, idx) => {
    ss.order = idx;
  });

  await saveTemplateStructure(templateId, structure, userId);
}

// ============================================================================
// QUESTION OPERATIONS
// ============================================================================

/**
 * Add a new question to a subsection
 */
export async function addQuestion(
  templateId: string,
  sectionId: string,
  subsectionId: string,
  question: Omit<TemplateQuestion, 'id' | 'order'>,
  userId: string,
  order?: number
): Promise<TemplateQuestion> {
  const structure = await getTemplateStructure(templateId);

  const section = structure.sections.find(s => s.id === sectionId);
  if (!section || !section.subsections) {
    throw new Error('Section not found');
  }

  const subsection = section.subsections.find(ss => ss.id === subsectionId);
  if (!subsection) {
    throw new Error('Subsection not found');
  }

  if (!subsection.questions) subsection.questions = [];

  const newQuestion: TemplateQuestion = {
    id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...question,
    order: order ?? subsection.questions.length,
  };

  subsection.questions.push(newQuestion);
  subsection.questions.sort((a, b) => a.order - b.order);

  await saveTemplateStructure(templateId, structure, userId);

  return newQuestion;
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  templateId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string,
  updates: Partial<Omit<TemplateQuestion, 'id'>>,
  userId: string
): Promise<void> {
  const structure = await getTemplateStructure(templateId);

  const section = structure.sections.find(s => s.id === sectionId);
  if (!section || !section.subsections) {
    throw new Error('Section not found');
  }

  const subsection = section.subsections.find(ss => ss.id === subsectionId);
  if (!subsection || !subsection.questions) {
    throw new Error('Subsection not found');
  }

  const question = subsection.questions.find(q => q.id === questionId);
  if (!question) {
    throw new Error('Question not found');
  }

  // Apply updates
  Object.assign(question, updates);

  if (updates.order !== undefined) {
    subsection.questions.sort((a, b) => a.order - b.order);
  }

  await saveTemplateStructure(templateId, structure, userId);
}

/**
 * Delete a question
 */
export async function deleteQuestion(
  templateId: string,
  sectionId: string,
  subsectionId: string,
  questionId: string,
  userId: string
): Promise<void> {
  const structure = await getTemplateStructure(templateId);

  const section = structure.sections.find(s => s.id === sectionId);
  if (!section || !section.subsections) {
    throw new Error('Section not found');
  }

  const subsection = section.subsections.find(ss => ss.id === subsectionId);
  if (!subsection || !subsection.questions) {
    throw new Error('Subsection not found');
  }

  const questionIndex = subsection.questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    throw new Error('Question not found');
  }

  subsection.questions.splice(questionIndex, 1);
  subsection.questions.forEach((q, idx) => {
    q.order = idx;
  });

  await saveTemplateStructure(templateId, structure, userId);
}

// ============================================================================
// TEMPLATE METADATA OPERATIONS
// ============================================================================

/**
 * Update template metadata (title, description, category, etc.)
 */
export async function updateTemplateMetadata(
  templateId: string,
  updates: EditTemplateInput,
  userId: string
): Promise<void> {
  const template = await prisma.rfpTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (!template.isEditable) {
    throw new Error('This template is locked and cannot be edited');
  }

  await prisma.rfpTemplate.update({
    where: { id: templateId },
    data: {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      lastEditedById: userId,
      updatedAt: new Date(),
    },
  });
}

/**
 * Lock a template (prevent further edits)
 */
export async function lockTemplate(templateId: string): Promise<void> {
  await prisma.rfpTemplate.update({
    where: { id: templateId },
    data: {
      isEditable: false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Unlock a template (allow edits)
 */
export async function unlockTemplate(templateId: string): Promise<void> {
  await prisma.rfpTemplate.update({
    where: { id: templateId },
    data: {
      isEditable: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * Create a new version of a template (duplicate)
 */
export async function createTemplateVersion(
  templateId: string,
  userId: string
): Promise<string> {
  const template = await prisma.rfpTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Create a new template with incremented version
  const newTemplate = await prisma.rfpTemplate.create({
    data: {
      categoryId: template.categoryId,
      title: `${template.title} (v${template.version + 1})`,
      description: template.description,
      structureJson: (template.sectionsJson || template.structureJson) as any,
      sectionsJson: template.sectionsJson as any,
      clausesJson: template.clausesJson as any,
      version: template.version + 1,
      isActive: false,  // New version starts as inactive
      isEditable: true,
      lastEditedById: userId,
    },
  });

  // Copy clause links
  const clauseLinks = await prisma.rfpTemplateClauseLink.findMany({
    where: { templateId },
  });

  if (clauseLinks.length > 0) {
    await prisma.rfpTemplateClauseLink.createMany({
      data: clauseLinks.map(link => ({
        templateId: newTemplate.id,
        clauseId: link.clauseId,
        required: link.required,
        createdById: userId,
      })),
    });
  }

  return newTemplate.id;
}
