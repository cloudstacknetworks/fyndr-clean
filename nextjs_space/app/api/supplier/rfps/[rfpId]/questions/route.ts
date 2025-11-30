/**
 * STEP 21: Supplier Question Submission API
 * 
 * GET  - Fetch supplier's own questions for an RFP
 * POST - Submit a new question (within the questions window)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { isQuestionWindowOpen } from '@/lib/qa-timeline';
import { notifyUserForEvent } from '@/lib/notifications';
import { SUPPLIER_QUESTION_CREATED } from '@/lib/notification-types';

const prisma = new PrismaClient();

/**
 * GET /api/supplier/rfps/[rfpId]/questions
 * Fetch all questions submitted by the authenticated supplier for this RFP
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
    
    // Find the supplier contact for this RFP and user
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
    
    // Fetch questions submitted by this supplier
    const questions = await prisma.supplierQuestion.findMany({
      where: {
        rfpId,
        supplierContactId: supplierContact.id
      },
      orderBy: {
        askedAt: 'desc'
      }
    });
    
    return NextResponse.json({ questions });
    
  } catch (error) {
    console.error('Error fetching supplier questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supplier/rfps/[rfpId]/questions
 * Submit a new question (only allowed within the questions window)
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
    
    // Verify supplier role
    if (session.user.role !== 'supplier') {
      return NextResponse.json(
        { error: 'Forbidden: Supplier access only' },
        { status: 403 }
      );
    }
    
    const { rfpId } = params;
    
    // Find the supplier contact for this RFP and user
    const supplierContact = await prisma.supplierContact.findFirst({
      where: {
        rfpId,
        portalUserId: session.user.id
      },
      include: {
        rfp: {
          select: {
            askQuestionsStart: true,
            askQuestionsEnd: true
          }
        }
      }
    });
    
    if (!supplierContact) {
      return NextResponse.json(
        { error: 'Access denied: You do not have access to this RFP' },
        { status: 403 }
      );
    }
    
    // Check if question window is open
    if (!isQuestionWindowOpen(supplierContact.rfp)) {
      return NextResponse.json(
        { error: 'Questions window is not open. You cannot submit questions at this time.' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { question } = body;
    
    // Validate question
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }
    
    // Validate question length (max 500 chars)
    if (question.length > 500) {
      return NextResponse.json(
        { error: 'Question cannot exceed 500 characters' },
        { status: 400 }
      );
    }
    
    if (question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      );
    }
    
    // Create the question
    const newQuestion = await prisma.supplierQuestion.create({
      data: {
        rfpId,
        supplierContactId: supplierContact.id,
        question: question.trim(),
        status: 'PENDING',
        askedAt: new Date()
      }
    });
    
    // STEP 22: Send notification to buyer about new supplier question
    try {
      const rfp = await prisma.rFP.findUnique({
        where: { id: rfpId },
        include: { user: true },
      });

      if (rfp && rfp.user) {
        await notifyUserForEvent(SUPPLIER_QUESTION_CREATED, rfp.user, {
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          questionId: newQuestion.id,
        });
      }
    } catch (notifError) {
      console.error('Error sending question created notification:', notifError);
      // Don't fail the question submission if notification fails
    }
    
    return NextResponse.json(
      {
        success: true,
        question: newQuestion
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error submitting supplier question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
