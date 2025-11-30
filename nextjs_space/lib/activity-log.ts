/**
 * Activity Log & Audit Trail System (STEP 23)
 * 
 * Core logging library for centralized activity logging.
 * Fire-and-forget logging with error handling to prevent breaking primary actions.
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ActivityEventType, ActivityActorRole } from "./activity-types";

const prisma = new PrismaClient();

/**
 * Extract request context (IP address and user agent) from Next.js request
 * @param req - NextRequest object
 * @returns Object with ipAddress and userAgent
 */
export function getRequestContext(req: NextRequest): {
  ipAddress?: string;
  userAgent?: string;
} {
  try {
    // Extract IP address from various headers (reverse proxy compatible)
    const ipAddress = 
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      req.ip ||
      undefined;

    // Extract user agent
    const userAgent = req.headers.get("user-agent") || undefined;

    return { ipAddress, userAgent };
  } catch (error) {
    console.error("[ActivityLog] Error extracting request context:", error);
    return {};
  }
}

/**
 * Log an activity event to the database
 * 
 * CRITICAL: This function is fire-and-forget and NEVER throws errors.
 * Logging failures are logged to console but do not affect the primary action.
 * 
 * @param options - Activity log options
 */
export async function logActivity(options: {
  eventType: ActivityEventType;
  actorRole: ActivityActorRole;
  summary: string;
  rfpId?: string;
  supplierResponseId?: string;
  supplierContactId?: string;
  userId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const {
      eventType,
      actorRole,
      summary,
      rfpId,
      supplierResponseId,
      supplierContactId,
      userId,
      details,
      ipAddress,
      userAgent,
    } = options;

    // Create activity log entry
    await prisma.activityLog.create({
      data: {
        eventType,
        actorRole,
        summary,
        rfpId: rfpId || null,
        supplierResponseId: supplierResponseId || null,
        supplierContactId: supplierContactId || null,
        userId: userId || null,
        details: details ? JSON.parse(JSON.stringify(details)) : null, // Ensure JSON serializable
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    // Log error but DO NOT throw - logging failures must not break primary actions
    console.error("[ActivityLog] Failed to log activity:", {
      eventType: options.eventType,
      summary: options.summary,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Helper function to log activity from an API route with request context
 * 
 * @param req - NextRequest object
 * @param options - Activity log options (excluding ipAddress and userAgent)
 */
export async function logActivityWithRequest(
  req: NextRequest,
  options: {
    eventType: ActivityEventType;
    actorRole: ActivityActorRole;
    summary: string;
    rfpId?: string;
    supplierResponseId?: string;
    supplierContactId?: string;
    userId?: string;
    details?: any;
  }
): Promise<void> {
  const { ipAddress, userAgent } = getRequestContext(req);
  
  await logActivity({
    ...options,
    ipAddress,
    userAgent,
  });
}
