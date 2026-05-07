import { Suspense } from "react";
import {
  getArticles,
  getArticleCategories,
  getCurrentTopNewsArticleId,
  getAllCategoryApprovalCountsToday,
  getMaxApprovedArticlesPerCategory,
} from "@/lib/actions/articles";
import { ArticlesTable } from "@/components/articles/articles-table";
import { ArticlesFilters } from "@/components/articles/articles-filters";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArticleStatus, ArticleClassification } from "@/types/database";

export const dynamic = "force-dynamic";

interface ArticlesPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    status?: ArticleStatus;
    classification?: ArticleClassification;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: string;
    approvedToday?: string;
  }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  // First, get the top news article ID so we can exclude it from approval counts
  const currentTopNewsArticleId = await getCurrentTopNewsArticleId();

  const [
    articlesData,
    categories,
    categoryApprovalCounts,
    maxApprovedPerCategory,
  ] = await Promise.all([
    getArticles({
      search: params.search,
      category: params.category,
      status: params.status,
      classification: params.classification,
      sortBy: params.sortBy || "article_category",
      sortOrder: params.sortOrder || "asc",
      page,
      limit: 50,
      approvedToday: params.approvedToday === "true",
    }),
    getArticleCategories(),
    getAllCategoryApprovalCountsToday(currentTopNewsArticleId),
    getMaxApprovedArticlesPerCategory(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Articles</h2>
        <p className="text-muted-foreground">
          Manage and review newsletter articles
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-16" />}>
        <ArticlesFilters categories={categories} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <ArticlesTable
          articles={articlesData.articles}
          totalPages={articlesData.totalPages}
          currentPage={articlesData.page}
          total={Number(articlesData.total)}
          statusFilter={params.status}
          classificationFilter={params.classification}
          currentTopNewsArticleId={currentTopNewsArticleId}
          categoryApprovalCounts={categoryApprovalCounts}
          maxApprovedPerCategory={maxApprovedPerCategory}
        />
      </Suspense>
    </div>
  );
}
