import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find supplier contact by token
    const supplierContact = await prisma.supplierContact.findFirst({
      where: {
        accessToken: token,
      },
      include: {
        rfp: true,
      },
    });

    if (!supplierContact) {
      return NextResponse.json(
        { error: 'Invalid or expired access link' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (supplierContact.accessTokenExpires && new Date() > supplierContact.accessTokenExpires) {
      // Update status to EXPIRED
      await prisma.supplierContact.update({
        where: { id: supplierContact.id },
        data: { invitationStatus: 'EXPIRED' },
      });

      return NextResponse.json(
        { error: 'This access link has expired. Please request a new invitation.' },
        { status: 401 }
      );
    }

    // Check if this supplier contact already has a portal user
    let supplierUser;
    let temporaryPassword;

    if (supplierContact.portalUserId) {
      // User already exists, fetch it
      supplierUser = await prisma.user.findUnique({
        where: { id: supplierContact.portalUserId },
      });

      if (!supplierUser) {
        return NextResponse.json(
          { error: 'Supplier user account not found' },
          { status: 404 }
        );
      }

      // For existing users, we'll use a special token-based auth
      // Generate a temporary password that will be valid for this session
      temporaryPassword = crypto.randomBytes(32).toString('hex');
      
      // Update user password temporarily
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      await prisma.user.update({
        where: { id: supplierUser.id },
        data: { password: hashedPassword },
      });

    } else {
      // Create new supplier user
      temporaryPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      supplierUser = await prisma.user.create({
        data: {
          email: supplierContact.email,
          password: hashedPassword,
          name: supplierContact.name,
          role: 'supplier',
        },
      });

      // Link supplier contact to this user
      await prisma.supplierContact.update({
        where: { id: supplierContact.id },
        data: {
          portalUserId: supplierUser.id,
          invitationStatus: 'ACCEPTED',
        },
      });
    }

    // Return success with user details
    return NextResponse.json({
      email: supplierUser.email,
      temporaryPassword,
      rfpId: supplierContact.rfpId,
      message: 'Token validated successfully',
    });

  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
