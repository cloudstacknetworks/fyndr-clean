import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { EditRFPForm } from "./edit-rfp-form";

const prisma = new PrismaClient();

async function getRFP(id: string) {
  const rfp = await prisma.rFP.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return rfp;
}

async function getCompanies() {
  return await prisma.company.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

async function getSuppliers() {
  return await prisma.supplier.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export default async function EditRFPPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const rfp = await getRFP(params.id);

  if (!rfp) {
    notFound();
  }

  const companies = await getCompanies();
  const suppliers = await getSuppliers();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Edit RFP
        </h1>
        <p className="text-gray-600 mb-8">
          Update the details of this RFP
        </p>

        <EditRFPForm rfp={rfp} companies={companies} suppliers={suppliers} />
      </div>
    </div>
  );
}
