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

  const data = await getSupplierDashboardData(session.user.id);
  if (!data) {
    return <div className="p-6">Supplier profile not found.</div>;
  }

  const { supplier, responses, awaitingResponse, deadlinesThisWeek, openQA, recentBroadcasts } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {supplier.name}</h1>
        <p className="text-gray-600">{supplier.organization}</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ActionCard
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          title="Awaiting Response"
          count={awaitingResponse.length}
          color="blue"
        />
        <ActionCard
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          title="Deadlines This Week"
          count={deadlinesThisWeek.length}
          color="orange"
        />
        <ActionCard
          icon={<MessageSquare className="h-6 w-6 text-green-600" />}
          title="Open Q&A Windows"
          count={openQA.length}
          color="green"
        />
        <ActionCard
          icon={<CheckCircle className="h-6 w-6 text-purple-600" />}
          title="Total RFPs"
          count={responses.length}
          color="purple"
        />
      </div>

      {/* Priority Actions */}
      {awaitingResponse.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Priority Actions</h2>
          <div className="space-y-3">
            {awaitingResponse.slice(0, 3).map((response: any) => (
              <PriorityActionItem
                key={response.id}
                rfpId={response.rfp.id}
                rfpTitle={response.rfp.title}
                companyName={response.rfp.company.name}
                deadline={response.rfp.submissionEnd}
                hasStarted={!!response.structuredAnswers}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Broadcasts */}
      {recentBroadcasts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Buyer Messages</h2>
          <div className="space-y-3">
            {recentBroadcasts.map((broadcast: any) => (
              <div key={broadcast.id} className="border-l-4 border-indigo-600 pl-4 py-2">
                <div className="font-medium">{broadcast.rfpTitle}</div>
                <div className="text-sm text-gray-600 mt-1">{broadcast.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(broadcast.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadlines This Week */}
      {deadlinesThisWeek.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {deadlinesThisWeek.map((response: any) => (
              <DeadlineItem
                key={response.id}
                rfpId={response.rfp.id}
                rfpTitle={response.rfp.title}
                deadline={response.rfp.submissionEnd!}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
