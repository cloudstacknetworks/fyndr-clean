/**
 * STEP 52: Buyer Email Digest Generator Engine
 * 
 * This engine generates personalized HTML email digests for buyers summarizing:
 * - RFP pipeline changes
 * - Recent awards
 * - Missing action items
 * - New supplier submissions
 * - Activity highlights
 * 
 * Reuses existing dashboard and notification engines for data consistency.
 */

import { prisma } from '@/lib/prisma';
import { buildBuyerHomeDashboard, type HomeDashboardData } from '@/lib/dashboard/home-dashboard-engine';
import { buildBuyerNotifications, type NotificationItem } from '@/lib/notifications/notification-engine';

// ========================
// TypeScript Type Definitions
// ========================

export interface EmailDigestData {
  timeframe: 'week' | 'month';
  generatedAt: Date;
  buyerName: string;
  buyerEmail: string;
  
  // Stats Summary
  summary: {
    activeRfpsCount: number;
    dueSoonCount: number;
    newAwardsCount: number;
    newSubmissionsCount: number;
    attentionItemsCount: number;
  };
  
  // Detailed Sections
  pipelineChanges: PipelineChange[];
  recentAwards: AwardSummary[];
  attentionItems: AttentionItemSummary[];
  recentSubmissions: SubmissionSummary[];
  activityHighlights: ActivityHighlight[];
  
  // Meta
  htmlContent: string;
}

export interface PipelineChange {
  rfpId: string;
  rfpTitle: string;
  changeType: 'created' | 'phase_changed' | 'due_soon' | 'overdue';
  changeDescription: string;
  timestamp: Date;
}

export interface AwardSummary {
  rfpId: string;
  rfpTitle: string;
  awardedSupplierName: string | null;
  awardStatus: string;
  awardDate: Date;
}

export interface AttentionItemSummary {
  rfpId: string;
  rfpTitle: string;
  itemType: 'decision_brief' | 'scoring_matrix' | 'exec_summary' | 'award';
  actionNeeded: string;
  reason: string;
}

export interface SubmissionSummary {
  rfpId: string;
  rfpTitle: string;
  supplierName: string;
  submittedAt: Date;
}

export interface ActivityHighlight {
  eventType: string;
  description: string;
  timestamp: Date;
  rfpTitle: string | null;
}

// ========================
// Main Engine Function
// ========================

/**
 * Build a comprehensive email digest for a buyer
 * 
 * @param userId - Buyer's user ID
 * @param companyId - Buyer's company ID
 * @param timeframe - 'week' or 'month'
 * @returns EmailDigestData with HTML content
 */
export async function buildBuyerEmailDigest(
  userId: string,
  companyId: string,
  timeframe: 'week' | 'month' = 'week'
): Promise<EmailDigestData> {
  try {
    // ========================================
    // Step 1: Get buyer information
    // ========================================
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        name: true, 
        email: true 
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const buyerName = user.name || 'Buyer';
    const buyerEmail = user.email || '';

    // ========================================
    // Step 2: Calculate timeframe window
    // ========================================
    const now = new Date();
    const timeframeDays = timeframe === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

    // ========================================
    // Step 3: Reuse existing dashboard engine
    // ========================================
    const dashboardData = await buildBuyerHomeDashboard(userId, companyId);

    // ========================================
    // Step 4: Fetch pipeline changes (RFPs within timeframe)
    // ========================================
    const pipelineChanges = await fetchPipelineChanges(userId, companyId, startDate);

    // ========================================
    // Step 5: Fetch recent awards
    // ========================================
    const recentAwards = await fetchRecentAwards(userId, companyId, startDate);

    // ========================================
    // Step 6: Derive attention items from dashboard
    // ========================================
    const attentionItems: AttentionItemSummary[] = dashboardData.attentionItems.map(item => ({
      rfpId: item.rfpId,
      rfpTitle: item.rfpTitle,
      itemType: item.type,
      actionNeeded: item.suggestedNextAction,
      reason: item.reason,
    }));

    // ========================================
    // Step 7: Fetch recent supplier submissions
    // ========================================
    const recentSubmissions = await fetchRecentSubmissions(userId, companyId, startDate);

    // ========================================
    // Step 8: Fetch activity highlights (from notifications)
    // ========================================
    const notificationsData = await buildBuyerNotifications(userId, companyId);
    const activityHighlights: ActivityHighlight[] = notificationsData.notifications
      .filter(n => new Date(n.timestamp) >= startDate)
      .slice(0, 10)
      .map(n => ({
        eventType: n.eventType,
        description: n.description,
        timestamp: new Date(n.timestamp),
        rfpTitle: n.rfpTitle,
      }));

    // ========================================
    // Step 9: Build summary stats
    // ========================================
    const summary = {
      activeRfpsCount: dashboardData.stats.activeCount,
      dueSoonCount: dashboardData.stats.dueSoonCount,
      newAwardsCount: recentAwards.length,
      newSubmissionsCount: recentSubmissions.length,
      attentionItemsCount: attentionItems.length,
    };

    // ========================================
    // Step 10: Generate HTML content
    // ========================================
    const htmlContent = generateEmailHTML({
      timeframe,
      buyerName,
      buyerEmail,
      summary,
      pipelineChanges,
      recentAwards,
      attentionItems,
      recentSubmissions,
      activityHighlights,
    });

    // ========================================
    // Step 11: Return complete digest
    // ========================================
    return {
      timeframe,
      generatedAt: now,
      buyerName,
      buyerEmail,
      summary,
      pipelineChanges,
      recentAwards,
      attentionItems,
      recentSubmissions,
      activityHighlights,
      htmlContent,
    };

  } catch (error) {
    console.error('[Email Digest Engine] Error building digest:', error);
    throw error;
  }
}

// ========================
// Helper Functions
// ========================

/**
 * Fetch pipeline changes (new RFPs, phase changes, etc.)
 */
async function fetchPipelineChanges(
  userId: string,
  companyId: string,
  startDate: Date
): Promise<PipelineChange[]> {
  const changes: PipelineChange[] = [];

  // New RFPs created within timeframe
  const newRfps = await prisma.rFP.findMany({
    where: {
      userId,
      companyId,
      createdAt: { gte: startDate },
      isArchived: false,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  for (const rfp of newRfps) {
    changes.push({
      rfpId: rfp.id,
      rfpTitle: rfp.title,
      changeType: 'created',
      changeDescription: `New RFP created`,
      timestamp: rfp.createdAt,
    });
  }

  // RFPs due soon (within next 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const dueSoonRfps = await prisma.rFP.findMany({
    where: {
      userId,
      companyId,
      isArchived: false,
      dueDate: {
        gte: now,
        lte: sevenDaysFromNow,
      },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
    },
    take: 10,
  });

  for (const rfp of dueSoonRfps) {
    if (rfp.dueDate) {
      const daysUntilDue = Math.ceil((rfp.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      changes.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        changeType: 'due_soon',
        changeDescription: `Due in ${daysUntilDue} days`,
        timestamp: new Date(),
      });
    }
  }

  // Overdue RFPs
  const overdueRfps = await prisma.rFP.findMany({
    where: {
      userId,
      companyId,
      isArchived: false,
      dueDate: { lt: now },
      OR: [
        { awardStatus: 'not_awarded' },
        { awardStatus: null },
      ],
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
    },
    take: 10,
  });

  for (const rfp of overdueRfps) {
    if (rfp.dueDate) {
      const daysOverdue = Math.ceil((now.getTime() - rfp.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      changes.push({
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        changeType: 'overdue',
        changeDescription: `${daysOverdue} days overdue`,
        timestamp: new Date(),
      });
    }
  }

  return changes.slice(0, 15);
}

/**
 * Fetch recent awards within timeframe
 */
async function fetchRecentAwards(
  userId: string,
  companyId: string,
  startDate: Date
): Promise<AwardSummary[]> {
  const awards = await prisma.rFP.findMany({
    where: {
      userId,
      companyId,
      awardStatus: { in: ['awarded', 'recommended'] },
      awardDecidedAt: { gte: startDate },
    },
    select: {
      id: true,
      title: true,
      awardStatus: true,
      awardDecidedAt: true,
      awardSnapshot: true,
    },
    orderBy: { awardDecidedAt: 'desc' },
    take: 10,
  });

  return awards.map(award => {
    let awardedSupplierName: string | null = null;
    
    // Extract supplier name from awardSnapshot if available
    if (award.awardSnapshot && typeof award.awardSnapshot === 'object') {
      const snapshot = award.awardSnapshot as any;
      if (snapshot.awardedSupplier?.name) {
        awardedSupplierName = snapshot.awardedSupplier.name;
      }
    }

    return {
      rfpId: award.id,
      rfpTitle: award.title,
      awardedSupplierName,
      awardStatus: award.awardStatus || 'not_awarded',
      awardDate: award.awardDecidedAt || new Date(),
    };
  });
}

/**
 * Fetch recent supplier submissions within timeframe
 */
async function fetchRecentSubmissions(
  userId: string,
  companyId: string,
  startDate: Date
): Promise<SubmissionSummary[]> {
  // Find RFPs owned by this buyer/company
  const buyerRfpIds = await prisma.rFP.findMany({
    where: { userId, companyId },
    select: { id: true },
  });

  const rfpIds = buyerRfpIds.map(r => r.id);

  if (rfpIds.length === 0) {
    return [];
  }

  // Fetch supplier responses submitted within timeframe
  const submissions = await prisma.supplierResponse.findMany({
    where: {
      rfpId: { in: rfpIds },
      submittedAt: { 
        gte: startDate,
        not: null,
      },
    },
    select: {
      rfpId: true,
      submittedAt: true,
      supplierContactId: true,
    },
    orderBy: { submittedAt: 'desc' },
    take: 20,
  });

  if (submissions.length === 0) {
    return [];
  }

  // Fetch RFP titles and supplier names separately
  const rfpMap = new Map<string, string>();
  const supplierMap = new Map<string, string>();
  
  const rfpIdsToFetch = [...new Set(submissions.map(s => s.rfpId))];
  const supplierContactIds = [...new Set(submissions.map(s => s.supplierContactId))];
  
  const [rfps, suppliers] = await Promise.all([
    prisma.rFP.findMany({
      where: { id: { in: rfpIdsToFetch } },
      select: { id: true, title: true },
    }),
    prisma.supplierContact.findMany({
      where: { id: { in: supplierContactIds } },
      select: { id: true, name: true, organization: true },
    }),
  ]);
  
  rfps.forEach(rfp => rfpMap.set(rfp.id, rfp.title));
  suppliers.forEach(supplier => {
    const displayName = supplier.organization || supplier.name;
    supplierMap.set(supplier.id, displayName);
  });

  return submissions.map(sub => ({
    rfpId: sub.rfpId,
    rfpTitle: rfpMap.get(sub.rfpId) || 'Unknown RFP',
    supplierName: supplierMap.get(sub.supplierContactId) || 'Unknown Supplier',
    submittedAt: sub.submittedAt!,
  }));
}

// ========================
// HTML Email Generator
// ========================

interface EmailHTMLData {
  timeframe: 'week' | 'month';
  buyerName: string;
  buyerEmail: string;
  summary: EmailDigestData['summary'];
  pipelineChanges: PipelineChange[];
  recentAwards: AwardSummary[];
  attentionItems: AttentionItemSummary[];
  recentSubmissions: SubmissionSummary[];
  activityHighlights: ActivityHighlight[];
}

function generateEmailHTML(data: EmailHTMLData): string {
  const timeframeLabel = data.timeframe === 'week' ? 'Weekly' : 'Monthly';
  const timeframeDays = data.timeframe === 'week' ? '7 days' : '30 days';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FYNDR ${timeframeLabel} Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #555;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      border-radius: 4px;
    }
    .stat-card.warning {
      border-left-color: #ff9800;
      background-color: #fff3e0;
    }
    .stat-card.success {
      border-left-color: #4caf50;
      background-color: #e8f5e9;
    }
    .stat-card.danger {
      border-left-color: #f44336;
      background-color: #ffebee;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin: 5px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    .item {
      padding: 15px;
      margin-bottom: 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border-left: 3px solid #667eea;
    }
    .item.warning {
      background-color: #fff3e0;
      border-left-color: #ff9800;
    }
    .item.danger {
      background-color: #ffebee;
      border-left-color: #f44336;
    }
    .item.success {
      background-color: #e8f5e9;
      border-left-color: #4caf50;
    }
    .item-title {
      font-weight: 600;
      color: #333;
      margin: 0 0 5px 0;
    }
    .item-description {
      font-size: 14px;
      color: #666;
      margin: 0 0 5px 0;
    }
    .item-meta {
      font-size: 12px;
      color: #999;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.created {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    .badge.due-soon {
      background-color: #fff3e0;
      color: #f57c00;
    }
    .badge.overdue {
      background-color: #ffebee;
      color: #d32f2f;
    }
    .badge.awarded {
      background-color: #e8f5e9;
      color: #388e3c;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 10px;
    }
    .empty-state {
      text-align: center;
      padding: 30px;
      color: #999;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 FYNDR ${timeframeLabel} Digest</h1>
      <p>Your personalized RFP activity summary for the past ${timeframeDays}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hi <strong>${data.buyerName}</strong>,
      </div>
      <p>Here's what happened in your RFP pipeline over the past ${timeframeDays}:</p>

      <!-- Summary Stats -->
      <div class="summary-grid">
        <div class="stat-card">
          <p class="stat-value">${data.summary.activeRfpsCount}</p>
          <p class="stat-label">Active RFPs</p>
        </div>
        <div class="stat-card warning">
          <p class="stat-value">${data.summary.dueSoonCount}</p>
          <p class="stat-label">Due Soon</p>
        </div>
        <div class="stat-card success">
          <p class="stat-value">${data.summary.newAwardsCount}</p>
          <p class="stat-label">New Awards</p>
        </div>
        <div class="stat-card">
          <p class="stat-value">${data.summary.newSubmissionsCount}</p>
          <p class="stat-label">New Submissions</p>
        </div>
        <div class="stat-card danger">
          <p class="stat-value">${data.summary.attentionItemsCount}</p>
          <p class="stat-label">Needs Attention</p>
        </div>
      </div>

      ${generateAttentionItemsSection(data.attentionItems)}
      ${generatePipelineChangesSection(data.pipelineChanges)}
      ${generateRecentAwardsSection(data.recentAwards)}
      ${generateRecentSubmissionsSection(data.recentSubmissions)}
      ${generateActivityHighlightsSection(data.activityHighlights)}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/home" class="cta-button">
          View Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>FYNDR RFP Management System</strong></p>
      <p>This is an automated digest. You're receiving this because you're an active buyer on FYNDR.</p>
      <p style="margin-top: 10px; color: #999;">
        Generated on ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateAttentionItemsSection(items: AttentionItemSummary[]): string {
  if (items.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">⚠️ Needs Attention</h2>
        <div class="empty-state">
          <p>✅ All caught up! No immediate action items.</p>
        </div>
      </div>
    `;
  }

  const itemsHTML = items.map(item => `
    <div class="item danger">
      <p class="item-title">${escapeHtml(item.rfpTitle)}</p>
      <p class="item-description"><strong>${item.actionNeeded}:</strong> ${escapeHtml(item.reason)}</p>
    </div>
  `).join('');

  return `
    <div class="section">
      <h2 class="section-title">⚠️ Needs Attention (${items.length})</h2>
      ${itemsHTML}
    </div>
  `;
}

function generatePipelineChangesSection(changes: PipelineChange[]): string {
  if (changes.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">📈 Pipeline Changes</h2>
        <div class="empty-state">
          <p>No significant pipeline changes in this period.</p>
        </div>
      </div>
    `;
  }

  const changesHTML = changes.map(change => {
    let badgeClass = 'created';
    if (change.changeType === 'due_soon') badgeClass = 'due-soon';
    if (change.changeType === 'overdue') badgeClass = 'overdue';

    let itemClass = '';
    if (change.changeType === 'overdue') itemClass = 'danger';
    if (change.changeType === 'due_soon') itemClass = 'warning';

    return `
      <div class="item ${itemClass}">
        <p class="item-title">${escapeHtml(change.rfpTitle)}</p>
        <p class="item-description">
          <span class="badge ${badgeClass}">${change.changeType.replace('_', ' ')}</span>
          ${escapeHtml(change.changeDescription)}
        </p>
        <p class="item-meta">${formatDate(change.timestamp)}</p>
      </div>
    `;
  }).join('');

  return `
    <div class="section">
      <h2 class="section-title">📈 Pipeline Changes (${changes.length})</h2>
      ${changesHTML}
    </div>
  `;
}

function generateRecentAwardsSection(awards: AwardSummary[]): string {
  if (awards.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">🏆 Recent Awards</h2>
        <div class="empty-state">
          <p>No awards made in this period.</p>
        </div>
      </div>
    `;
  }

  const awardsHTML = awards.map(award => `
    <div class="item success">
      <p class="item-title">${escapeHtml(award.rfpTitle)}</p>
      <p class="item-description">
        <span class="badge awarded">${award.awardStatus}</span>
        ${award.awardedSupplierName ? `Awarded to: <strong>${escapeHtml(award.awardedSupplierName)}</strong>` : 'Award decision recorded'}
      </p>
      <p class="item-meta">${formatDate(award.awardDate)}</p>
    </div>
  `).join('');

  return `
    <div class="section">
      <h2 class="section-title">🏆 Recent Awards (${awards.length})</h2>
      ${awardsHTML}
    </div>
  `;
}

function generateRecentSubmissionsSection(submissions: SubmissionSummary[]): string {
  if (submissions.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">📥 Recent Submissions</h2>
        <div class="empty-state">
          <p>No new supplier submissions in this period.</p>
        </div>
      </div>
    `;
  }

  const submissionsHTML = submissions.slice(0, 10).map(sub => `
    <div class="item">
      <p class="item-title">${escapeHtml(sub.rfpTitle)}</p>
      <p class="item-description">
        New submission from <strong>${escapeHtml(sub.supplierName)}</strong>
      </p>
      <p class="item-meta">${formatDate(sub.submittedAt)}</p>
    </div>
  `).join('');

  return `
    <div class="section">
      <h2 class="section-title">📥 Recent Submissions (${Math.min(submissions.length, 10)})</h2>
      ${submissionsHTML}
    </div>
  `;
}

function generateActivityHighlightsSection(highlights: ActivityHighlight[]): string {
  if (highlights.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">✨ Activity Highlights</h2>
        <div class="empty-state">
          <p>No recent activity highlights.</p>
        </div>
      </div>
    `;
  }

  const highlightsHTML = highlights.slice(0, 8).map(activity => `
    <div class="item">
      <p class="item-description">${escapeHtml(activity.description)}</p>
      <p class="item-meta">${formatDate(activity.timestamp)}</p>
    </div>
  `).join('');

  return `
    <div class="section">
      <h2 class="section-title">✨ Activity Highlights (${Math.min(highlights.length, 8)})</h2>
      ${highlightsHTML}
    </div>
  `;
}

// ========================
// Utility Functions
// ========================

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
