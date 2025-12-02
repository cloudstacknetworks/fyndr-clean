import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, DollarSign, Users } from "lucide-react";
import { getOpportunityRating } from "@/lib/opportunity-scoring";

// Phase definitions
const PHASE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  PLANNING: { 
    label: "Planning", 
    color: "bg-gray-100 text-gray-700", 
    description: "RFPs in the planning phase, preparing for invitation" 
  },
  INVITATION: { 
    label: "Invitation", 
    color: "bg-blue-100 text-blue-700", 
    description: "Invitations sent to suppliers, awaiting confirmation" 
  },
  Q_AND_A: { 
    label: "Q&A", 
    color: "bg-purple-100 text-purple-700", 
    description: "Q&A window open for supplier questions" 
  },
  SUBMISSION: { 
    label: "Submission", 
    color: "bg-indigo-100 text-indigo-700", 
    description: "Awaiting supplier response submissions" 
  },
  EVALUATION: { 
    label: "Evaluation", 
    color: "bg-yellow-100 text-yellow-700", 
    description: "Evaluating and comparing supplier responses" 
  },
  DEMO: { 
    label: "Demo", 
    color: "bg-green-100 text-green-700", 
    description: "Scheduling and conducting supplier demos" 
  },
  AWARD: { 
    label: "Award", 
    color: "bg-emerald-100 text-emerald-700", 
    description: "Finalizing award decision" 
  },
};

interface PageProps {
  params: {
    phaseId: string;
  };
}

export default async function PhaseDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  // Buyer-only access
  if (!session || !session.user) {
    redirect("/login");
  }
  
  if (session.user.role !== "buyer") {
    redirect("/dashboard");
  }

  const phaseId = params.phaseId;
  
  // Validate phase ID
  if (!PHASE_CONFIG[phaseId]) {
    notFound();
  }

  const phaseInfo = PHASE_CONFIG[phaseId];

  // Fetch all RFPs for the authenticated buyer
  const allRfps = await prisma.rFP.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      budget: true,
      createdAt: true,
      timelineStateSnapshot: true,
      opportunityScore: true,
      company: {
        select: {
          name: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
      supplierResponses: {
        where: {
          status: "SUBMITTED",
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter RFPs by phase
  const rfpsInPhase = allRfps.filter(rfp => {
    if (rfp.timelineStateSnapshot && typeof rfp.timelineStateSnapshot === "object") {
      const snapshot = rfp.timelineStateSnapshot as any;
      if (snapshot.currentPhase && snapshot.currentPhase.phaseId) {
        return snapshot.currentPhase.phaseId === phaseId;
      }
    }
    // Default phase is PLANNING
    return phaseId === "PLANNING";
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/rfps/lifecycle"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {phaseInfo.label} Phase
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${phaseInfo.color}`}>
                {rfpsInPhase.length} RFPs
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {phaseInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* RFP List */}
      <div className="p-6">
        {rfpsInPhase.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No RFPs in this phase</p>
            <Link
              href="/dashboard/rfps/lifecycle"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block"
            >
              ← Back to Lifecycle Board
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rfpsInPhase.map(rfp => {
              const opportunityRating = rfp.opportunityScore !== null 
                ? getOpportunityRating(rfp.opportunityScore) 
                : null;

              const getCriticalDate = () => {
                if (!rfp.timelineStateSnapshot) return null;
                const snapshot = rfp.timelineStateSnapshot as any;
                
                if (!snapshot.nextEvents || snapshot.nextEvents.length === 0) return null;
                
                const nextEvent = snapshot.nextEvents[0];
                if (!nextEvent.at) return null;
                
                const eventDate = new Date(nextEvent.at);
                const label = nextEvent.label || "Upcoming";
                
                return { label, date: eventDate };
              };

              const criticalDate = getCriticalDate();

              return (
                <Link
                  key={rfp.id}
                  href={`/dashboard/rfps/${rfp.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
                    {/* Title and Score */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
                        {rfp.title}
                      </h3>
                      {opportunityRating && (
                        <div
                          className={`ml-2 flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${opportunityRating.bgColor} ${opportunityRating.textColor}`}
                          title={`Opportunity Score: ${rfp.opportunityScore} (${opportunityRating.label})`}
                        >
                          {rfp.opportunityScore}
                        </div>
                      )}
                    </div>

                    {/* Company & Supplier */}
                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      <p><span className="font-medium">Company:</span> {rfp.company.name}</p>
                      <p><span className="font-medium">Supplier:</span> {rfp.supplier.name}</p>
                    </div>

                    {/* Budget */}
                    {rfp.budget && (
                      <div className="flex items-center space-x-1 text-sm text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">${rfp.budget.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Supplier Engagement */}
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                      <Users className="w-4 h-4" />
                      <span>Suppliers Engaged: {rfp.supplierResponses.length}</span>
                    </div>

                    {/* Critical Date */}
                    {criticalDate && (
                      <div className="flex items-center space-x-1 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{criticalDate.label}:</span>
                        <span>{criticalDate.date.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
