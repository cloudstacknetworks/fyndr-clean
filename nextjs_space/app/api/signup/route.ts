import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company for new user (derived from email domain)
    const emailDomain = email.split('@')[1] || 'company';
    const companyName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
    
    const company = await prisma.company.create({
      data: {
        name: `${companyName} Inc.`,
        description: 'New company account',
        isDemo: false,
      },
    });

    // Create user associated with company
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        companyId: company.id,
        role: 'buyer',
        isDemo: false,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: { id: user.id, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
