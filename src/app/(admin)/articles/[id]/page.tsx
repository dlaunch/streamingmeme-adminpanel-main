export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import {
  getArticleById,
  getCurrentTopNewsArticleId,
  getApprovedCountForCategoryToday,
  getMaxApprovedArticlesPerCategory,
  markArticleAsRead,
} from "@/lib/actions/articles";
import { ArticleDetail } from "@/components/articles/article-detail";

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params;
  const [article, currentTopNewsArticleId, maxApprovedPerCategory] = await Promise.all([
    getArticleById(id),
    getCurrentTopNewsArticleId(),
    getMaxApprovedArticlesPerCategory(),
  ]);

  if (!article) {
    notFound();
  }

  await markArticleAsRead(id);

  const approvedCountForCategory = await getApprovedCountForCategoryToday(
    article.articleCategory,
    currentTopNewsArticleId
  );

  return (
    <ArticleDetail
      article={article}
      currentTopNewsArticleId={currentTopNewsArticleId}
      approvedCountForCategory={approvedCountForCategory}
      maxApprovedPerCategory={maxApprovedPerCategory}
    />
  );
}
