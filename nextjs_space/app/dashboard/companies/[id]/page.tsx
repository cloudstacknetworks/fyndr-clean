import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { ArrowLeft, Calendar, Edit, Trash2, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteCompanyButton } from "./delete-company-button";

const prisma = new PrismaClient();

async function getCompany(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        rfps: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            rfps: true,
          },
        },
      },
    });
    return company;
  } catch (error) {
    console.error("Error fetching company:", error);
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

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await getCompany(params.id);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Companies
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/companies/${company.id}/edit`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Link>
              <DeleteCompanyButton 
                companyId={company.id} 
                companyName={company.name}
                hasRFPs={company._count.rfps > 0}
                rfpCount={company._count.rfps}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Created At</p>
              <p className="text-gray-900">{formatDate(company.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Associated RFPs</p>
              <p className="text-gray-900">
                {company._count.rfps} RFP{company._count.rfps !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          {company.description ? (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {company.description}
            </p>
          ) : (
            <p className="text-gray-400 italic">No description provided</p>
          )}
        </div>

        {company.rfps.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Associated RFPs</h2>
            <div className="space-y-3">
              {company.rfps.map((rfp) => (
                <Link
                  key={rfp.id}
                  href={`/dashboard/rfps/${rfp.id}`}
                  className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                        {rfp.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {formatDate(rfp.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        rfp.status
                      )}`}
                    >
                      {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
