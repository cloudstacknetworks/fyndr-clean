import { NewRFPForm } from "./new-rfp-form";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getCompaniesAndSuppliers() {
  try {
    const [companies, suppliers] = await Promise.all([
      prisma.company.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.supplier.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);
    return { companies, suppliers };
  } catch (error) {
    console.error("Error fetching companies and suppliers:", error);
    return { companies: [], suppliers: [] };
  }
}

export default async function NewRFPPage() {
  const { companies, suppliers } = await getCompaniesAndSuppliers();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New RFP</h1>
          <p className="text-gray-600">
            Fill in the details below to create a new Request for Proposal
          </p>
        </div>
        <NewRFPForm companies={companies} suppliers={suppliers} />
      </div>
    </div>
  );
}
