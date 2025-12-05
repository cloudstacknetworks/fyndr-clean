/**
 * Step 62: Supplier Portal Enhancements
 * Service layer for supplier-facing RFP operations
 * 
 * CRITICAL SECURITY CONSTRAINTS:
 * - All functions must be scoped to a specific supplier (userId with role='supplier')
 * - Never expose buyer-internal data (scores, comments, AI reasoning, other suppliers)
 * - Return 404 for unauthorized access (not 403) to avoid information leakage
 */

import { prisma } from '@/lib/prisma';
import { RFPStage, SupplierResponseStatus, InvitationStatus, QuestionStatus } from '@prisma/client';

/**
 * Map RFPStage enum to user-friendly stage labels
 */
function mapStageToLabel(stage: RFPStage): string {
  const stageMap: Record<RFPStage, string> = {
    INTAKE: 'Invitation',
    QUALIFICATION: 'Q&A',
    DISCOVERY: 'Q&A',
    DRAFTING: 'Submission',
    PRICING_LEGAL_REVIEW: 'Submission',
    EXEC_REVIEW: 'Evaluation',
    SUBMISSION: 'Demo',
    DEBRIEF: 'Award',
    ARCHIVED: 'Archived'
  };
  return stageMap[stage] || 'Unknown';
}

/**
 * Compute supplier status based on invitation and response data
 */
function computeSupplierStatus(
  invitationStatus: InvitationStatus,
  responseStatus: SupplierResponseStatus | null,
  submittedAt: Date | null,
  awardOutcomeStatus: string | null
): string {
  if (awardOutcomeStatus) {
    return 'Outcome Available';
  }
  if (submittedAt && responseStatus === 'SUBMITTED') {
    return 'Submitted';
  }
  if (responseStatus === 'DRAFT' || invitationStatus === 'ACCEPTED') {
    return 'In Progress';
  }
  if (invitationStatus === 'SENT' || invitationStatus === 'PENDING') {
    return 'Invited';
  }
  if (invitationStatus === 'REJECTED') {
    return 'Withdrawn';
  }
  return 'Invited';
}

/**
 * Get list of RFPs for a supplier user
 */
export async function getSupplierRFPList(supplierUserId: string) {
  // Find all supplier contacts for this user
  const supplierContacts = await prisma.supplierContact.findMany({
    where: {
      portalUserId: supplierUserId
    },
    include: {
      rfp: {
        include: {
          company: {
            select: {
              name: true
            }
          }
        }
      },
      supplierResponse: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          awardOutcomeStatus: true
        }
      }
    }
  });

  // Transform to supplier-safe format
  const rfpList = await Promise.all(
    supplierContacts.map(async (contact) => {
      const rfp = contact.rfp;
      const response = contact.supplierResponse;

      // Count pending questions
      const pendingQuestionsCount = await prisma.supplierQuestion.count({
        where: {
          rfpId: rfp.id,
          supplierContactId: contact.id,
          status: 'PENDING'
        }
      });

      // Check if overdue
      const isOverdue = rfp.submissionEnd && 
                       new Date() > rfp.submissionEnd && 
                       response?.status !== 'SUBMITTED';

      // Compute supplier status
      const supplierStatus = computeSupplierStatus(
        contact.invitationStatus,
        response?.status || null,
        response?.submittedAt || null,
        response?.awardOutcomeStatus || null
      );

      // Map outcome status (only if allowed to be shown)
      let outcomeStatus = null;
      if (response?.awardOutcomeStatus) {
        const outcomeMap: Record<string, string> = {
          'recommended': 'Awarded',
          'shortlisted': 'In Review',
          'not_selected': 'Not Selected',
          'declined': 'Canceled'
        };
        outcomeStatus = outcomeMap[response.awardOutcomeStatus] || 'In Review';
      }

      return {
        rfpId: rfp.id,
        title: rfp.title,
        buyerCompanyName: rfp.company.name,
        stage: mapStageToLabel(rfp.stage),
        status: rfp.status,
        submissionDeadline: rfp.submissionEnd,
        qnaEndDate: rfp.askQuestionsEnd,
        demoWindowStart: rfp.demoWindowStart,
        demoWindowEnd: rfp.demoWindowEnd,
        supplierStatus,
        outcomeStatus,
        hasPendingQuestions: pendingQuestionsCount > 0,
        hasPendingUploads: false, // Best effort - would need more complex logic
        isOverdue: !!isOverdue,
        invitedAt: contact.invitedAt,
        submittedAt: response?.submittedAt || null
      };
    })
  );

  return rfpList;
}

/**
 * Get detailed summary for one RFP (supplier-scoped)
 */
export async function getSupplierRFPSummary(rfpId: string, supplierUserId: string) {
  // Find supplier contact for this user and RFP
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: supplierUserId
    },
    include: {
      rfp: {
        include: {
          company: {
            select: {
              name: true
            }
          }
        }
      },
      supplierResponse: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          structuredAnswers: true,
          awardOutcomeStatus: true
        }
      }
    }
  });

  if (!supplierContact) {
    return null; // Will result in 404
  }

  const rfp = supplierContact.rfp;
  const response = supplierContact.supplierResponse;

  // Count requirements and answers
  let totalRequirements = 0;
  let answeredRequirements = 0;

  if (rfp.requirementGroups && typeof rfp.requirementGroups === 'object') {
    const groups = rfp.requirementGroups as any;
    if (Array.isArray(groups)) {
      for (const group of groups) {
        if (Array.isArray(group.requirements)) {
          totalRequirements += group.requirements.length;
        }
      }
    }
  }

  if (response?.structuredAnswers && typeof response.structuredAnswers === 'object') {
    const answers = response.structuredAnswers as any;
    answeredRequirements = Object.keys(answers).length;
  }

  // Count uploaded documents
  const uploadedDocumentsCount = response
    ? await prisma.supplierResponseAttachment.count({
        where: { supplierResponseId: response.id }
      })
    : 0;

  // Count unanswered questions
  const unansweredQuestionsCount = await prisma.supplierQuestion.count({
    where: {
      rfpId,
      supplierContactId: supplierContact.id,
      status: 'PENDING'
    }
  });

  // Compute status
  const supplierStatus = computeSupplierStatus(
    supplierContact.invitationStatus,
    response?.status || null,
    response?.submittedAt || null,
    response?.awardOutcomeStatus || null
  );

  return {
    rfpId: rfp.id,
    title: rfp.title,
    description: rfp.description, // Safe to expose (non-confidential summary)
    buyerCompanyName: rfp.company.name,
    stage: mapStageToLabel(rfp.stage),
    stageRaw: rfp.stage,
    status: rfp.status,
    submissionDeadline: rfp.submissionEnd,
    qnaEndDate: rfp.askQuestionsEnd,
    demoWindowStart: rfp.demoWindowStart,
    demoWindowEnd: rfp.demoWindowEnd,
    supplierStatus,
    invitedAt: supplierContact.invitedAt,
    submittedAt: response?.submittedAt || null,
    totalRequirements,
    answeredRequirements,
    uploadedDocumentsCount,
    unansweredQuestionsCount
  };
}

/**
 * Get requirements list for supplier (no scores, no internal metadata)
 */
export async function getSupplierRequirements(rfpId: string, supplierUserId: string) {
  // Verify access
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: supplierUserId
    },
    include: {
      rfp: {
        select: {
          requirementGroups: true
        }
      },
      supplierResponse: {
        select: {
          id: true,
          structuredAnswers: true,
          updatedAt: true
        }
      }
    }
  });

  if (!supplierContact) {
    return null;
  }

  const rfp = supplierContact.rfp;
  const response = supplierContact.supplierResponse;
  const answers = (response?.structuredAnswers as any) || {};

  // Count attachments per requirement (if needed)
  const attachments = response
    ? await prisma.supplierResponseAttachment.findMany({
        where: { supplierResponseId: response.id },
        select: { id: true, fileName: true, description: true }
      })
    : [];

  // Parse requirements from JSON
  const requirements: any[] = [];
  if (rfp.requirementGroups && typeof rfp.requirementGroups === 'object') {
    const groups = rfp.requirementGroups as any;
    if (Array.isArray(groups)) {
      for (const group of groups) {
        const category = group.category || group.name || 'General';
        if (Array.isArray(group.requirements)) {
          for (const req of group.requirements) {
            requirements.push({
              requirementId: req.id || req.key || String(Math.random()),
              title: req.question || req.title || req.label || 'Requirement',
              category,
              subcategory: req.subcategory || null,
              answered: !!answers[req.id || req.key],
              hasUploadedDoc: attachments.length > 0, // Simplified - could be more granular
              lastUpdatedAt: response?.updatedAt || null
            });
          }
        }
      }
    }
  }

  return requirements;
}

/**
 * Get documents uploaded by supplier
 */
export async function getSupplierDocuments(rfpId: string, supplierUserId: string) {
  // Verify access
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: supplierUserId
    },
    select: {
      id: true,
      name: true,
      email: true,
      supplierResponse: {
        select: {
          id: true
        }
      }
    }
  });

  if (!supplierContact || !supplierContact.supplierResponse) {
    return null;
  }

  const documents = await prisma.supplierResponseAttachment.findMany({
    where: {
      supplierResponseId: supplierContact.supplierResponse.id
    },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      attachmentType: true,
      description: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return documents.map((doc) => ({
    documentId: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    attachmentType: doc.attachmentType,
    description: doc.description,
    uploadedAt: doc.createdAt,
    uploadedBy: `${supplierContact.name} (${supplierContact.email})`
  }));
}

/**
 * Get submission preview (read-only view of supplier's answers)
 */
export async function getSupplierSubmissionPreview(rfpId: string, supplierUserId: string) {
  // Verify access
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: supplierUserId
    },
    include: {
      rfp: {
        select: {
          id: true,
          title: true,
          requirementGroups: true,
          company: {
            select: {
              name: true
            }
          }
        }
      },
      supplierResponse: {
        select: {
          structuredAnswers: true,
          notesFromSupplier: true,
          submittedAt: true,
          status: true
        }
      }
    }
  });

  if (!supplierContact) {
    return null;
  }

  const rfp = supplierContact.rfp;
  const response = supplierContact.supplierResponse;
  const answers = (response?.structuredAnswers as any) || {};

  // Get documents
  const documents = response
    ? await prisma.supplierResponseAttachment.findMany({
        where: {
          supplierResponse: {
            rfpId,
            supplierContactId: supplierContact.id
          }
        },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          attachmentType: true,
          description: true
        }
      })
    : [];

  // Build preview structure
  const sections: any[] = [];
  if (rfp.requirementGroups && typeof rfp.requirementGroups === 'object') {
    const groups = rfp.requirementGroups as any;
    if (Array.isArray(groups)) {
      for (const group of groups) {
        const section = {
          category: group.category || group.name || 'General',
          requirements: [] as any[]
        };

        if (Array.isArray(group.requirements)) {
          for (const req of group.requirements) {
            const reqId = req.id || req.key;
            section.requirements.push({
              questionText: req.question || req.title || req.label,
              supplierAnswer: answers[reqId] || '(Not answered)',
              linkedDocuments: documents
                .filter((d) => d.description?.includes(reqId))
                .map((d) => ({
                  fileName: d.fileName,
                  fileType: d.fileType
                }))
            });
          }
        }

        sections.push(section);
      }
    }
  }

  return {
    rfpTitle: rfp.title,
    buyerCompanyName: rfp.company.name,
    supplierName: supplierContact.name,
    supplierOrganization: supplierContact.organization,
    submittedAt: response?.submittedAt,
    status: response?.status || 'DRAFT',
    sections,
    allDocuments: documents.map((d) => ({
      fileName: d.fileName,
      fileType: d.fileType,
      attachmentType: d.attachmentType
    })),
    notesFromSupplier: response?.notesFromSupplier || null
  };
}

/**
 * Get outcome summary (high-level only, no detailed scoring)
 */
export async function getSupplierOutcome(rfpId: string, supplierUserId: string) {
  // Verify access
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: supplierUserId
    },
    include: {
      rfp: {
        select: {
          awardDecidedAt: true,
          awardStatus: true
        }
      },
      supplierResponse: {
        select: {
          awardOutcomeStatus: true
        }
      }
    }
  });

  if (!supplierContact || !supplierContact.supplierResponse) {
    return null;
  }

  const outcomeStatusRaw = supplierContact.supplierResponse.awardOutcomeStatus;

  if (!outcomeStatusRaw) {
    // No outcome available yet
    return {
      outcomeStatus: null,
      outcomeDate: null,
      simpleOutcomeMessage: 'The buyer has not yet finalized the decision for this RFP.'
    };
  }

  // Map to user-friendly status
  const outcomeMap: Record<string, { status: string; message: string }> = {
    recommended: {
      status: 'Awarded',
      message: 'Congratulations! You have been recommended for this RFP.'
    },
    shortlisted: {
      status: 'In Review',
      message: 'You have been shortlisted and are under consideration.'
    },
    not_selected: {
      status: 'Not Selected',
      message: 'Thank you for your submission. You were not selected for this RFP.'
    },
    declined: {
      status: 'Canceled',
      message: 'This RFP opportunity was canceled or declined.'
    }
  };

  const outcome = outcomeMap[outcomeStatusRaw] || {
    status: 'In Review',
    message: 'Your submission is currently under review.'
  };

  return {
    outcomeStatus: outcome.status,
    outcomeDate: supplierContact.rfp.awardDecidedAt,
    simpleOutcomeMessage: outcome.message
  };
}

/**
 * Check if supplier can upload documents (submission window open)
 */
export async function canSupplierUploadDocuments(rfpId: string, supplierUserId: string): Promise<boolean> {
  const supplierContact = await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: supplierUserId
    },
    include: {
      rfp: {
        select: {
          submissionEnd: true,
          status: true
        }
      },
      supplierResponse: {
        select: {
          status: true,
          submittedAt: true
        }
      }
    }
  });

  if (!supplierContact) {
    return false;
  }

  const rfp = supplierContact.rfp;
  const response = supplierContact.supplierResponse;

  // Check if submission window is still open
  const submissionWindowOpen = !rfp.submissionEnd || new Date() <= rfp.submissionEnd;

  // Check if RFP is not archived/closed
  const rfpActive = rfp.status !== 'archived' && rfp.status !== 'closed';

  // Check if response not already submitted
  const notSubmitted = !response || response.status === 'DRAFT';

  return submissionWindowOpen && rfpActive && notSubmitted;
}
