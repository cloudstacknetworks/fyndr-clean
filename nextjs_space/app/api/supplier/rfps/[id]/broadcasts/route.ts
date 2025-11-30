/**
 * STEP 21: Supplier Broadcast Messages API
 * 
 * GET - Fetch all broadcast messages for an RFP (visible to all suppliers)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/supplier/rfps/[rfpId]/broadcasts
 * Fetch all broadcast messages for this RFP
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { rfpId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify supplier role
    if (session.user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Forbidden: Supplier access only' },
        { status: 403 }
      );
    }
    
    const { rfpId } = params;
    
    // Verify supplier has access to this RFP
    const supplierContact = await prisma.supplierContact.findFirst({
      where: {
        rfpId,
        portalUserId: session.user.id
      }
    });
    
    if (!supplierContact) {
      return NextResponse.json(
        { error: 'Access denied: You do not have access to this RFP' },
        { status: 403 }
      );
    }
    
    // Fetch all broadcast messages for this RFP
    const broadcasts = await prisma.supplierBroadcastMessage.findMany({
      where: {
        rfpId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ broadcasts });
    
  } catch (error) {
    console.error('Error fetching broadcast messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
