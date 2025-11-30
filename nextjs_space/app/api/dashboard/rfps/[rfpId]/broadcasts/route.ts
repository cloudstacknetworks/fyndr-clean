/**
 * STEP 21: Buyer Broadcast API
 * 
 * POST - Create a broadcast message for all suppliers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/dashboard/rfps/[rfpId]/broadcasts
 * Create a new broadcast message (buyer only)
 */
export async function POST(
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
    
    // Verify buyer role
    if (session.user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Forbidden: Buyer access only' },
        { status: 403 }
      );
    }
    
    const { rfpId } = params;
    
    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId }
    });
    
    if (!rfp) {
      return NextResponse.json(
        { error: 'RFP not found' },
        { status: 404 }
      );
    }
    
    if (rfp.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this RFP' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { message } = body;
    
    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Create the broadcast message
    const broadcast = await prisma.supplierBroadcastMessage.create({
      data: {
        rfpId,
        message: message.trim(),
        createdBy: session.user.id,
        createdAt: new Date()
      }
    });
    
    return NextResponse.json(
      {
        success: true,
        broadcast
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating broadcast message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
