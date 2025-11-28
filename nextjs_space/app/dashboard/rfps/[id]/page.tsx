import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { ArrowLeft, Calendar, User, Building2, Users, DollarSign, Flag, FileText, Edit } from "lucide-react";
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

function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
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

function getPriorityColor(priority: string) {
  switch (priority) {
    case "LOW":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "HIGH":
      return "bg-red-100 text-red-800";
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
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/rfps"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to RFPs
        </Link>
        <Link
          href={`/dashboard/rfps/${rfp.id}/edit`}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <Edit className="h-5 w-5" />
          Edit RFP
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{rfp.title}</h1>
            <div className="flex gap-2">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  rfp.status
                )}`}
              >
                {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(
                  rfp.priority
                )}`}
              >
                <Flag className="h-4 w-4" />
                {rfp.priority}
              </span>
            </div>
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

          {rfp.dueDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Due Date</p>
                <p className="text-gray-900">{formatDateOnly(rfp.dueDate)}</p>
              </div>
            </div>
          )}

          {rfp.submittedAt && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Submitted At</p>
                <p className="text-gray-900">{formatDateOnly(rfp.submittedAt)}</p>
              </div>
            </div>
          )}

          {rfp.budget !== null && (
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Budget</p>
                <p className="text-gray-900 font-semibold text-lg">
                  {formatCurrency(rfp.budget)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          {rfp.description ? (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {rfp.description}
            </p>
          ) : (
            <p className="text-gray-400 italic">No description provided</p>
          )}
        </div>

        {rfp.internalNotes && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-900">Internal Notes</h2>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-semibold">
                INTERNAL USE ONLY
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {rfp.internalNotes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
