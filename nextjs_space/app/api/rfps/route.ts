import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/rfps - Fetch all RFPs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rfps = await prisma.rFP.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(rfps);
  } catch (error) {
    console.error("Error fetching RFPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFPs" },
      { status: 500 }
    );
  }
}

// POST /api/rfps - Create a new RFP
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, companyId, supplierId } = body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!companyId || companyId.trim() === "") {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 }
      );
    }

    if (!supplierId || supplierId.trim() === "") {
      return NextResponse.json(
        { error: "Supplier is required" },
        { status: 400 }
      );
    }

    // Validate that the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Invalid company selected" },
        { status: 400 }
      );
    }

    // Validate that the supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Invalid supplier selected" },
        { status: 400 }
      );
    }

    // Create the RFP with validated data
    const rfp = await prisma.rFP.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: "draft",
        userId: session.user.id,
        companyId: companyId,
        supplierId: supplierId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(rfp, { status: 201 });
  } catch (error) {
    console.error("Error creating RFP:", error);
    return NextResponse.json(
      { error: "Failed to create RFP" },
      { status: 500 }
    );
  }
}
