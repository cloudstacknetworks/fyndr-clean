import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { EditCompanyForm } from "./edit-company-form";

const prisma = new PrismaClient();

async function getCompany(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    return company;
  } catch (error) {
    console.error("Error fetching company:", error);
    return null;
  }
}

export default async function EditCompanyPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await getCompany(params.id);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Company</h1>
          <p className="text-gray-600">
            Update the details for {company.name}
          </p>
        </div>
        <EditCompanyForm company={company} />
      </div>
    </div>
  );
}
