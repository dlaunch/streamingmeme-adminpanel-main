import { Suspense } from "react";
import { getSponsors } from "@/lib/actions/sponsors";
import { getCurrentTopNewsSponsorId } from "@/lib/actions/articles";
import { SponsorsList } from "@/components/sponsors/sponsors-list";
import { CreateSponsorDialog } from "@/components/sponsors/create-sponsor-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

interface SponsorsPageProps {
  searchParams: Promise<{
    search?: string;
    isActive?: string;
    page?: string;
  }>;
}

export default async function SponsorsPage({ searchParams }: SponsorsPageProps) {
  const params = await searchParams;

  const [sponsors, currentTopNewsSponsorId] = await Promise.all([
    getSponsors({
      search: params.search,
      isActive: params.isActive === "true" ? true : params.isActive === "false" ? false : undefined,
    }),
    getCurrentTopNewsSponsorId(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sponsors</h2>
          <p className="text-muted-foreground">
            Manage sponsored content for the newsletter
          </p>
        </div>
        <CreateSponsorDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <SponsorsList
          sponsors={sponsors}
          currentTopNewsSponsorId={currentTopNewsSponsorId}
        />
      </Suspense>
    </div>
  );
}
