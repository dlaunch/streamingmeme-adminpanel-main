import { Suspense } from "react";
import { getAdminHistory } from "@/lib/actions/admin-history";
import { AdminHistoryTable } from "@/components/admin-history/admin-history-table";
import { AdminHistoryFilters } from "@/components/admin-history/admin-history-filters";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminHistoryStatus } from "@/types/database";

export const dynamic = "force-dynamic";

interface AdminHistoryPageProps {
  searchParams: Promise<{
    status?: AdminHistoryStatus;
    createdBy?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function AdminHistoryPage({ searchParams }: AdminHistoryPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const historyData = await getAdminHistory({
    status: params.status,
    createdBy: params.createdBy,
    startDate: params.startDate,
    endDate: params.endDate,
    page,
    limit: 50,
  });
 
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin History</h2>
        <p className="text-muted-foreground">
          View all admin actions and audit trail
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-16" />}>
        <AdminHistoryFilters />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <AdminHistoryTable
          history={historyData.history}
          totalPages={historyData.totalPages}
          currentPage={historyData.page}
          total={Number(historyData.total)}
        />
      </Suspense>
    </div>
  );
}
