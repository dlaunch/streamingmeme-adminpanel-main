import { Suspense } from "react";
import { getArticleStats, getDashboardPendingArticles } from "@/lib/actions/articles";
import { getRecentAdminActivity, getAdminActivityStats } from "@/lib/actions/admin-history";
import { getActiveSponsors } from "@/lib/actions/sponsors";
import { DashboardStats } from "@/components/dashboard/stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PendingArticlesPreview } from "@/components/dashboard/pending-articles-preview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [articleStats, recentActivity, activityStats, pendingArticles, activeSponsors] =
    await Promise.all([
      getArticleStats(),
      getRecentAdminActivity(10),
      getAdminActivityStats(),
      getDashboardPendingArticles(5),
      getActiveSponsors(),
    ]);

  // Waiting approval: status is "waiting_approval" (all classifications)
  const waitingApprovalCount =
    articleStats.byStatusAndClassification
      .filter((s) => s.status === "waiting_approval")
      .reduce((sum, s) => sum + (s.count || 0), 0);

  // Approved: status is "approved_for_publishing" and classification is NOT "archived" or "published"
  const approvedCount =
    articleStats.byStatusAndClassification
      .filter((s) => s.status === "approved_for_publishing" && s.classification !== "archived" && s.classification !== "published")
      .reduce((sum, s) => sum + (s.count || 0), 0);

  // Declined: status is "filtered_out", classification is NOT "archived", aggregated within last 3 days (PT)
  const declinedCount = articleStats.declinedCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the Newsletter Admin Panel
        </p>
      </div>

      <Suspense fallback={<StatsSkeletons />}>
        <DashboardStats
          waitingApprovalCount={Number(waitingApprovalCount)}
          approvedCount={Number(approvedCount)}
          declinedCount={Number(declinedCount)}
          avgAiScore={articleStats.avgPendingAiScore}
          activeSponsorsCount={activeSponsors.length}
          todayActions={activityStats.today.reduce((sum, s) => sum + Number(s.count), 0)}
        />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <PendingArticlesPreview
              articles={pendingArticles}
              totalPending={Number(waitingApprovalCount)}
            />
          </Suspense>
        </div>

        <div className="space-y-6">
          <QuickActions />
          <Suspense fallback={<Skeleton className="h-[300px]" />}>
            <RecentActivity activities={recentActivity} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function StatsSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px]" />
      ))}
    </div>
  );
}
