import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { Plus } from "lucide-react";

const prisma = new PrismaClient();

async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            rfps: true,
          },
        },
      },
    });
    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="max-w-6xl">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Suppliers</h1>
            <p className="text-gray-600">Manage your suppliers here.</p>
          </div>
          <Link
            href="/dashboard/suppliers/new"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create New Supplier
          </Link>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No suppliers found</p>
            <p className="text-gray-400 mb-6">Get started by creating your first supplier</p>
            <Link
              href="/dashboard/suppliers/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              <Plus className="h-5 w-5" />
              Create Supplier
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">RFPs</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created At</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <Link
                        href={`/dashboard/suppliers/${supplier.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        {supplier.name}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {supplier.contactEmail || "-"}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {supplier._count.rfps} RFP{supplier._count.rfps !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {formatDate(supplier.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
