import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/rfps/[id]/suppliers/[supplierId] - Delete a supplier contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; supplierId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rfpId = params.id;
    const supplierId = params.supplierId;

    // Verify RFP ownership
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      select: { userId: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    if (rfp.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify supplier contact exists and belongs to this RFP
    const supplierContact = await prisma.supplierContact.findUnique({
      where: { id: supplierId },
    });

    if (!supplierContact) {
      return NextResponse.json(
        { error: 'Supplier contact not found' },
        { status: 404 }
      );
    }

    if (supplierContact.rfpId !== rfpId) {
      return NextResponse.json(
        { error: 'Supplier contact does not belong to this RFP' },
        { status: 400 }
      );
    }

    // Delete the supplier contact
    await prisma.supplierContact.delete({
      where: { id: supplierId },
    });

    return NextResponse.json({
      message: 'Supplier contact deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
