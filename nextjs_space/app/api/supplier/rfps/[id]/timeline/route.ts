/**
 * STEP 21: Supplier Timeline API
 * Fetch RFP timeline data for question window enforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { rfpId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Fetch RFP timeline fields
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: {
        askQuestionsStart: true,
        askQuestionsEnd: true
      }
    });
    
    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rfp);
    
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
