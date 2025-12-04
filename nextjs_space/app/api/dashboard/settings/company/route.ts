/**
 * STEP 53: Company Settings API Endpoint
 * GET /api/dashboard/settings/company - Fetch company settings
 * PUT /api/dashboard/settings/company - Update company settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { logActivityWithRequest } from '@/lib/activity-log';
import { EVENT_TYPES, ACTOR_ROLES } from '@/lib/activity-types';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/settings/company
 * Fetch company settings for the authenticated buyer
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================
    // Authentication & Authorization
    // ========================================
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden. Only buyers can access company settings.' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    
    // Fetch user's companyId from their first RFP
    const firstRfp = await prisma.rFP.findFirst({
      where: { userId: userId },
      select: { companyId: true },
    });
    
    if (!firstRfp || !firstRfp.companyId) {
      return NextResponse.json(
        { error: 'No company found for this user.' },
        { status: 404 }
      );
    }
    
    const companyId = firstRfp.companyId;

    // ========================================
    // Fetch Company Settings
    // ========================================
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        brandColor: true,
        timezone: true,
        fiscalYearStartMonth: true,
        createdAt: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found.' },
        { status: 404 }
      );
    }

    // ========================================
    // Return Company Settings
    // ========================================
    return NextResponse.json({
      success: true,
      company,
    });
    
  } catch (error) {
    console.error('[Company Settings GET API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching company settings.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/settings/company
 * Update company settings for the authenticated buyer
 */
export async function PUT(request: NextRequest) {
  try {
    // ========================================
    // Authentication & Authorization
    // ========================================
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden. Only buyers can update company settings.' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    
    // Fetch user's companyId from their first RFP
    const firstRfp = await prisma.rFP.findFirst({
      where: { userId: userId },
      select: { companyId: true },
    });
    
    if (!firstRfp || !firstRfp.companyId) {
      return NextResponse.json(
        { error: 'No company found for this user.' },
        { status: 404 }
      );
    }
    
    const companyId = firstRfp.companyId;

    // ========================================
    // Parse Request Body
    // ========================================
    const body = await request.json();
    const { name, description, logo, brandColor, timezone, fiscalYearStartMonth } = body;

    // Validate fiscal year start month (1-12)
    if (fiscalYearStartMonth !== undefined && fiscalYearStartMonth !== null) {
      const month = parseInt(fiscalYearStartMonth);
      if (isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'Invalid fiscal year start month. Must be between 1 and 12.' },
          { status: 400 }
        );
      }
    }

    // ========================================
    // Update Company Settings
    // ========================================
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (brandColor !== undefined) updateData.brandColor = brandColor;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (fiscalYearStartMonth !== undefined) {
      updateData.fiscalYearStartMonth = fiscalYearStartMonth === null ? null : parseInt(fiscalYearStartMonth);
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        brandColor: true,
        timezone: true,
        fiscalYearStartMonth: true,
        createdAt: true,
      },
    });

    // ========================================
    // Log Activity
    // ========================================
    try {
      await logActivityWithRequest(request, {
        eventType: EVENT_TYPES.SETTINGS_COMPANY_UPDATED,
        actorRole: ACTOR_ROLES.BUYER,
        userId: userId,
        summary: `${session.user.name || session.user.email} updated company settings`,
        details: {
          companyId,
          updatedFields: Object.keys(updateData),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // Activity logging is non-blocking
      console.error('[Company Settings PUT API] Activity logging failed:', logError);
    }

    // ========================================
    // Return Updated Company Settings
    // ========================================
    return NextResponse.json({
      success: true,
      message: 'Company settings updated successfully.',
      company: updatedCompany,
    });
    
  } catch (error) {
    console.error('[Company Settings PUT API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating company settings.' },
      { status: 500 }
    );
  }
}
