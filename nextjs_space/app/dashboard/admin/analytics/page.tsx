/**
 * STEP 64: Admin Analytics Dashboard Page
 * Server component for /dashboard/admin/analytics
 * 
 * Access Control:
 * - Validates user is authenticated and has "buyer" role
 * - Redirects non-admin users to home with access denied message
 * - All analytics are scoped to user's companyId
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import AdminAnalyticsDashboardClient from "./AdminAnalyticsDashboardClient";

export const metadata = {
  title: "Admin Analytics | Fyndr",
  description: "Portfolio-level insights and analytics for admin users",
};

export default async function AdminAnalyticsPage() {
  // ========================================
  // Authentication & Authorization
  // ========================================
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Admin check: must be a buyer
  if (session.user.role !== "buyer") {
    redirect("/dashboard/home?error=access_denied");
  }

  // ========================================
  // Render Client Component
  // ========================================
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminAnalyticsDashboardClient
        userId={session.user.id}
        userRole={session.user.role}
        companyId={session.user.companyId}
      />
    </div>
  );
}
