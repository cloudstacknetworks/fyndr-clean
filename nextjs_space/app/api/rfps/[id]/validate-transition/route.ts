import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { validateStageTransition } from '@/lib/stage-transition-rules';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newStage } = await req.json();

    if (!newStage) {
      return NextResponse.json({ error: 'newStage is required' }, { status: 400 });
    }

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: params.id },
      select: { id: true, stage: true, userId: true }
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate the transition
    const validationResult = await validateStageTransition(
      rfp.stage,
      newStage,
      params.id
    );

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate transition' },
      { status: 500 }
    );
  }
}
