/**
 * STEP 47: Archive Guards
 * 
 * Helper functions to enforce read-only behavior on archived RFPs.
 */

import { prisma } from '@/lib/prisma';

/**
 * Checks if an RFP is archived.
 * Returns true if archived, false otherwise.
 */
export async function isRfpArchived(rfpId: string): Promise<boolean> {
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    select: { isArchived: true },
  });

  return rfp?.isArchived || false;
}

/**
 * Throws an error if the RFP is archived.
 * Use this in mutation endpoints to reject updates.
 */
export async function guardAgainstArchivedRfp(rfpId: string): Promise<void> {
  const archived = await isRfpArchived(rfpId);
  
  if (archived) {
    throw new Error('Cannot modify archived RFP. This RFP is read-only.');
  }
}
