import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Clock, FileText, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getSupplierDashboardData(userId: string) {
  const supplier = await prisma.supplierContact.findUnique({
    where: { portalUserId: userId }
  });

  if (!supplier) return null;

  // Get all supplier responses for this contact
  const responses = await prisma.supplierResponse.findMany({
    where: { supplierContactId: supplier.id },
    include: {
      rfp: {
        include: {
          company: true,
          supplierBroadcastMessages: { orderBy: { createdAt: "desc" }, take: 5 }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // RFPs awaiting response
  const awaitingResponse = responses.filter(
    (r) => !r.submittedAt && r.rfp.submissionEnd && r.rfp.submissionEnd > now
  );

  // Deadlines this week
  const deadlinesThisWeek = responses.filter(
    (r) => r.rfp.submissionEnd && r.rfp.submissionEnd >= now && r.rfp.submissionEnd <= nextWeek
  );

  // Open Q&A windows
  const openQA = responses.filter(
    (r) => r.rfp.askQuestionsStart && r.rfp.askQuestionsEnd && 
         r.rfp.askQuestionsStart <= now && r.rfp.askQuestionsEnd >= now
  );

  // Recent broadcasts
  const recentBroadcasts = responses
    .flatMap((r) => r.rfp.supplierBroadcastMessages.map((b) => ({ ...b, rfpTitle: r.rfp.title })))
    .slice(0, 5);

  return {
    supplier,
    responses,
    awaitingResponse,
    deadlinesThisWeek,
    openQA,
    recentBroadcasts
  };
}

export default async function SupplierDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "supplier") {
    redirect("/login");
  }

  // STEP 54: Redirect suppliers to the new Work Inbox as default landing page
  redirect("/dashboard/supplier/home");
}

function ActionCard({ icon, title, count, color }: any) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    orange: "bg-orange-50 border-orange-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200"
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-sm text-gray-600">{title}</div>
        </div>
      </div>
    </div>
  );
}

function PriorityActionItem({ rfpId, rfpTitle, companyName, deadline, hasStarted }: any) {
  const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <div className="font-medium">{rfpTitle}</div>
        <div className="text-sm text-gray-600">{companyName}</div>
        <div className="text-xs text-gray-500 mt-1">
          Due in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
        </div>
      </div>
      <Link
        href={`/supplier/rfps/${rfpId}`}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        data-demo-action="continue-response"
      >
        {hasStarted ? "Continue Response" : "Start Response"}
      </Link>
    </div>
  );
}

function DeadlineItem({ rfpId, rfpTitle, deadline }: any) {
  const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Link
      href={`/supplier/rfps/${rfpId}`}
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
    >
      <div>
        <div className="font-medium">{rfpTitle}</div>
        <div className="text-sm text-gray-600">
          {new Date(deadline).toLocaleDateString()}
        </div>
      </div>
      <div className={`text-sm font-semibold ${daysUntil <= 2 ? "text-red-600" : "text-orange-600"}`}>
        {daysUntil} day{daysUntil !== 1 ? "s" : ""} left
      </div>
    </Link>
  );
}
