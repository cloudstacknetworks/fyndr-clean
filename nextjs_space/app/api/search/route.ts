import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import Fuse from 'fuse.js';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    // Return empty results if query is too short
    if (query.length < 2) {
      return NextResponse.json({
        rfps: [],
        companies: [],
        suppliers: [],
      });
    }

    // Search across RFPs (title and description) - fetch all matching records
    const allRfps = await prisma.rFP.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        description: true,
      },
    });

    // Search across Companies (name) - fetch all matching records
    const allCompanies = await prisma.company.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Search across Suppliers (name) - fetch all matching records
    const allSuppliers = await prisma.supplier.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Apply Fuse.js ranking to RFPs
    const rfpFuse = new Fuse(allRfps, {
      threshold: 0.4,
      distance: 100,
      keys: ['title', 'description'],
    });
    const rfpResults = rfpFuse.search(query);
    const rankedRfps = rfpResults.slice(0, 10).map((result) => result.item);

    // Apply Fuse.js ranking to Companies
    const companyFuse = new Fuse(allCompanies, {
      threshold: 0.4,
      distance: 100,
      keys: ['name'],
    });
    const companyResults = companyFuse.search(query);
    const rankedCompanies = companyResults.slice(0, 10).map((result) => result.item);

    // Apply Fuse.js ranking to Suppliers
    const supplierFuse = new Fuse(allSuppliers, {
      threshold: 0.4,
      distance: 100,
      keys: ['name'],
    });
    const supplierResults = supplierFuse.search(query);
    const rankedSuppliers = supplierResults.slice(0, 10).map((result) => result.item);

    // Return structured results with fuzzy search ranking
    return NextResponse.json({
      rfps: rankedRfps,
      companies: rankedCompanies,
      suppliers: rankedSuppliers,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
