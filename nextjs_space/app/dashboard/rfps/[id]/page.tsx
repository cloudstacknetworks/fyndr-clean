import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { ArrowLeft, Calendar, User, Building2, Users } from "lucide-react";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

async function getRFP(id: string) {
  try {
    const rfp = await prisma.rFP.findUnique({
      where: { id },
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
            description: true,
          },
        },
        supplier: {
          select: {
            name: true,
            contactEmail: true,
          },
        },
      },
    });
    return rfp;
  } catch (error) {
    console.error("Error fetching RFP:", error);
    return null;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "published":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function RFPDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const rfp = await getRFP(params.id);

  if (!rfp) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/rfps"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to RFPs
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{rfp.title}</h1>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                rfp.status
              )}`}
            >
              {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Created By</p>
              <p className="text-gray-900">
                {rfp.user?.name || rfp.user?.email || "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Created At</p>
              <p className="text-gray-900">{formatDate(rfp.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Company</p>
              <p className="text-gray-900">
                {rfp.company?.name || "Not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Supplier</p>
              <p className="text-gray-900">
                {rfp.supplier?.name || "Not specified"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          {rfp.description ? (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {rfp.description}
            </p>
          ) : (
            <p className="text-gray-400 italic">No description provided</p>
          )}
        </div>
      </div>
    </div>
  );
}
