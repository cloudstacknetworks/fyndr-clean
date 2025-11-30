/**
 * STEP 21: Buyer Q&A Management API
 * 
 * GET  - Fetch all questions for an RFP (buyer view)
 * POST - Answer a question with optional broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { notifyUserForEvent } from '@/lib/notifications';
import { SUPPLIER_QUESTION_ANSWERED, SUPPLIER_BROADCAST_CREATED } from '@/lib/notification-types';

const prisma = new PrismaClient();

/**
 * GET /api/dashboard/rfps/[rfpId]/questions
 * Fetch all questions for this RFP (buyer only)
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
    
    // Fetch all questions for this RFP with supplier info
    const questions = await prisma.supplierQuestion.findMany({
      where: {
        rfpId
      },
      include: {
        supplierContact: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true
          }
        }
      },
      orderBy: {
        askedAt: 'desc'
      }
    });
    
    return NextResponse.json({ questions });
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/rfps/[rfpId]/questions
 * Answer a question with optional broadcast
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
    const { questionId, answer, broadcast } = body;
    
    // Validate inputs
    if (!questionId || !answer) {
      return NextResponse.json(
        { error: 'Question ID and answer are required' },
        { status: 400 }
      );
    }
    
    if (typeof answer !== 'string' || answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Answer cannot be empty' },
        { status: 400 }
      );
    }
    
    // Verify question exists and belongs to this RFP
    const question = await prisma.supplierQuestion.findUnique({
      where: { id: questionId }
    });
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (question.rfpId !== rfpId) {
      return NextResponse.json(
        { error: 'Question does not belong to this RFP' },
        { status: 400 }
      );
    }
    
    // Update the question with the answer
    const updatedQuestion = await prisma.supplierQuestion.update({
      where: { id: questionId },
      data: {
        answer: answer.trim(),
        status: 'ANSWERED',
        answeredAt: new Date()
      },
      include: {
        supplierContact: {
          include: {
            portalUser: true
          }
        }
      }
    });
    
    // If broadcast is enabled, create a broadcast message
    let broadcastMessage = null;
    if (broadcast === true) {
      broadcastMessage = await prisma.supplierBroadcastMessage.create({
        data: {
          rfpId,
          message: answer.trim(),
          createdBy: session.user.id,
          createdAt: new Date()
        }
      });
    }
    
    // STEP 22: Send notifications
    try {
      if (broadcast === true) {
        // Notify all suppliers about broadcast
        const allSupplierContacts = await prisma.supplierContact.findMany({
          where: {
            rfpId,
            portalUserId: { not: null }
          },
          include: {
            portalUser: true
          }
        });

        for (const contact of allSupplierContacts) {
          if (contact.portalUser) {
            await notifyUserForEvent(SUPPLIER_BROADCAST_CREATED, contact.portalUser, {
              rfpId: rfp.id,
              rfpTitle: rfp.title,
              broadcastId: broadcastMessage?.id,
            });
          }
        }
      } else {
        // Notify specific supplier about their answered question
        if (updatedQuestion.supplierContact.portalUser) {
          await notifyUserForEvent(SUPPLIER_QUESTION_ANSWERED, updatedQuestion.supplierContact.portalUser, {
            rfpId: rfp.id,
            rfpTitle: rfp.title,
            questionId: updatedQuestion.id,
          });
        }
      }
    } catch (notifError) {
      console.error('Error sending question answer notifications:', notifError);
      // Don't fail the answer if notification fails
    }
    
    return NextResponse.json({
      success: true,
      question: updatedQuestion,
      broadcast: broadcast ? broadcastMessage : null
    });
    
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
