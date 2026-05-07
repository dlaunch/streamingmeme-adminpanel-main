import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CategoryCountsBar } from "@/components/layout/category-counts-bar";
import {
  getAllCategoryApprovalCountsToday,
  getMaxApprovedArticlesPerCategory,
  getArticleCategories,
  getCurrentTopNewsArticleId,
} from "@/lib/actions/articles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentTopNewsArticleId, maxPerCategory, categories] =
    await Promise.all([
      getCurrentTopNewsArticleId(),
      getMaxApprovedArticlesPerCategory(),
      getArticleCategories(),
    ]);

  const categoryApprovalCounts =
    await getAllCategoryApprovalCountsToday(currentTopNewsArticleId);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header />
        <CategoryCountsBar
          categoryApprovalCounts={categoryApprovalCounts}
          maxPerCategory={maxPerCategory}
          categories={categories}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
