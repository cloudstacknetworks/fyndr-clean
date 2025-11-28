import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { EditSupplierForm } from "./edit-supplier-form";

const prisma = new PrismaClient();

async function getSupplier(id: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        contactEmail: true,
      },
    });
    return supplier;
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return null;
  }
}

export default async function EditSupplierPage({
  params,
}: {
  params: { id: string };
}) {
  const supplier = await getSupplier(params.id);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Supplier</h1>
          <p className="text-gray-600">
            Update the details for {supplier.name}
          </p>
        </div>
        <EditSupplierForm supplier={supplier} />
      </div>
    </div>
  );
}
