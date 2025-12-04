/**
 * STEP 53: User Management API Endpoints
 * GET /api/dashboard/settings/users - List all users in the company
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/settings/users
 * Fetch all users in the company
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
        { error: 'Forbidden. Only buyers can access user management.' },
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
    // Fetch All Users in the Company
    // ========================================
    // Find all RFPs for this company to get unique user IDs
    const rfps = await prisma.rFP.findMany({
      where: { companyId: companyId },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = rfps.map(rfp => rfp.userId);

    // Fetch user details
    const users = await prisma.user.findMany({
      where: { 
        id: { in: userIds },
        role: 'buyer', // Only show buyers (not suppliers)
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // ========================================
    // Return Users
    // ========================================
    return NextResponse.json({
      success: true,
      users,
    });
    
  } catch (error) {
    console.error('[User Management GET API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching users.' },
      { status: 500 }
    );
  }
}
