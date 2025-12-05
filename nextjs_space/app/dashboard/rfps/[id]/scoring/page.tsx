/**
 * STEP 59: Auto-Scoring Workspace Page (Server Component)
 * 
 * Fetches RFP and supplier responses, then renders client component
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ScoringWorkspaceClient from './components/ScoringWorkspaceClient';

export default async function ScoringWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  // 1. Validate session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // 2. Enforce buyer-only access
  if (session.user.role !== 'buyer') {
    redirect('/dashboard');
  }

  const companyId = session.user.companyId;

  // 3. Fetch RFP with supplier responses
  const rfp = await prisma.rFP.findFirst({
    where: {
      id: params.id,
      companyId: companyId,
    },
    include: {
      supplierResponses: {
        include: {
          supplierContact: {
            select: {
              id: true,
              name: true,
              email: true,
              organization: true,
            },
          },
        },
      },
    },
  });

  if (!rfp) {
    redirect('/dashboard');
  }

  // 4. Render client component with data
  return (
    <ScoringWorkspaceClient
      rfp={rfp}
      supplierResponses={rfp.supplierResponses}
    />
  );
}
