"use server";

import { db } from "@/lib/db";
import { articles, adminHistory, topNewsItems } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, asc, sql, inArray, count, ne } from "drizzle-orm";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import {
  approveArticleSchema,
  declineArticleSchema,
  archiveArticleSchema,
  unapproveArticleSchema,
  bulkActionSchema,
  promoteToTopNewsSchema,
  updateArticleSchema,
} from "@/lib/validations/article";
import type {
  ArticleStatus,
  ArticleClassification,
  AdminHistoryStatus,
} from "@/types/database";
import { getAppDayRange } from "@/lib/utils/date";

export type ArticleActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export type ArticleFilters = {
  search?: string;
  category?: string;
  status?: ArticleStatus;
  classification?: ArticleClassification;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  approvedToday?: boolean;
};

// Default statuses to show when no filter is applied
const DEFAULT_STATUSES: ArticleStatus[] = [
  "pending_analysis",
  "for_categorization",
  "for_verification",
  "waiting_approval",
  "approved_for_publishing",
  "filtered_out",
];

// Maximum number of articles that can be approved per category per day
const MAX_APPROVED_ARTICLES_PER_CATEGORY = 3;


export async function getMaxApprovedArticlesPerCategory(): Promise<number> {
  return MAX_APPROVED_ARTICLES_PER_CATEGORY;
}

export async function markArticleAsRead(articleId: string): Promise<void> {
  const user = await getUser();
  if (!user) return;

  await db
    .update(articles)
    .set({ markedReadBy: user.id, markedReadAt: new Date() })
    .where(
      and(
        eq(articles.id, articleId),
        sql`${articles.markedReadBy} IS NULL`,
        sql`${articles.markedReadAt} IS NULL`
      )
    );
}

export async function getArticles(filters: ArticleFilters = {}) {
  const {
    search,
    category,
    status,
    classification,
    sortBy = "article_category",
    sortOrder = "asc",
    page = 1,
    limit = 50,
    approvedToday,
  } = filters;

  try {
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(articles.title, `%${search}%`),
          ilike(articles.sourceName, `%${search}%`),
          ilike(articles.chatgptSummary, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(sql`${articles.articleCategory} = ${category}`);
    }

    if (status) {
      conditions.push(eq(articles.status, status));
    } else {
      // By default, only show articles with the allowed statuses
      conditions.push(inArray(articles.status, DEFAULT_STATUSES));
    }

    if (classification) {
      conditions.push(eq(articles.classification, classification));
    } else if (status !== "waiting_approval") {
      // By default, exclude archived and published articles unless explicitly filtering for them
      // Exception: when filtering by waiting_approval, show all classifications
      conditions.push(sql`${articles.classification} != 'archived'`);
      conditions.push(sql`${articles.classification} != 'published'`);
    }

    if (status === "filtered_out" || !status) {
      const { today } = getAppDayRange();
      const cutoffDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const cutoff = cutoffDate.toISOString();
      if (status === "filtered_out") {
        conditions.push(sql`${articles.aggregatedAt} >= ${cutoff}`);
      } else {
        // All Statuses: only apply the cutoff to filtered_out rows
        conditions.push(
          or(
            sql`${articles.status} != 'filtered_out'`,
            sql`${articles.aggregatedAt} >= ${cutoff}`
          )
        );
      }
    }

    if (approvedToday) {
      const { today, tomorrow } = getAppDayRange();
      conditions.push(
        sql`${articles.approvedAt} >= ${today.toISOString()}`,
        sql`${articles.approvedAt} < ${tomorrow.toISOString()}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      title: articles.title,
      ai_score: articles.aiAnalyzerTotalScore,
      created_at: articles.aggregatedAt,
      original_publish_date: articles.originalPublishDate,
      article_category: articles.articleCategory,
    }[sortBy] || articles.articleCategory;

    const orderFn = sortOrder === "desc" ? desc : asc;

    // Special sorting for waiting_approval: category, date desc, classification (active first)
    const orderByClause =
      status === "waiting_approval"
        ? [
            asc(articles.articleCategory),
            desc(articles.aiAnalyzerTotalScore),
            desc(articles.aggregatedAt),
            sql`CASE WHEN ${articles.classification} = 'active' THEN 0 ELSE 1 END`,
          ]
        : [orderFn(sortColumn), desc(articles.aggregatedAt)];

    const [articleList, totalCountResult] = await Promise.all([
      db
        .select()
        .from(articles)
        .where(whereClause)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(articles)
        .where(whereClause),
    ]);

    return {
      articles: articleList,
      total: totalCountResult[0]?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCountResult[0]?.count || 0) / limit),
    };
  } catch (error) {
    console.error("Error fetching articles:", error);
    return {
      articles: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

export async function getDashboardPendingArticles(limit = 5) {
  return db
    .select()
    .from(articles)
    .where(eq(articles.status, "waiting_approval"))
    .orderBy(desc(articles.aggregatedAt))
    .limit(limit);
}

export async function getPendingArticles(filters: ArticleFilters = {}) {
  return getArticles({
    ...filters,
    status: "waiting_approval",
  });
}

export async function getArticleById(id: string) {
  const article = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  return article[0] || null;
}

export async function getArticleCategories() {
  const categories = await db
    .selectDistinct({ category: articles.articleCategory })
    .from(articles)
    .where(sql`${articles.articleCategory} IS NOT NULL`);

  return categories
    .map((c) => c.category)
    .filter((c) => c !== null);
}

/**
 * Get the count of approved articles for a specific category for today
 * @param category - The category to count
 * @param excludeArticleId - Optional article ID to exclude from the count (e.g., top news article)
 */
export async function getApprovedCountForCategoryToday(
  category: string | null,
  excludeArticleId?: string | null
): Promise<number> {
  if (!category) return 0;

  const { today, tomorrow } = getAppDayRange();

  const conditions = [
    sql`${articles.articleCategory} = ${category}`,
    eq(articles.status, "approved_for_publishing"),
    ne(articles.classification, "published"),
    sql`${articles.approvedAt} >= ${today.toISOString()}`,
    sql`${articles.approvedAt} < ${tomorrow.toISOString()}`,
  ];

  if (excludeArticleId) {
    conditions.push(ne(articles.id, excludeArticleId));
  }

  const result = await db
    .select({ count: count() })
    .from(articles)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

/**
 * Get approved counts for all categories for today
 * @param excludeArticleId - Optional article ID to exclude from the count (e.g., top news article)
 */
export async function getAllCategoryApprovalCountsToday(
  excludeArticleId?: string | null
): Promise<Record<string, number>> {
  const { today, tomorrow } = getAppDayRange();

  const conditions = [
    eq(articles.status, "approved_for_publishing"),
    ne(articles.classification, "published"),
    sql`${articles.approvedAt} >= ${today.toISOString()}`,
    sql`${articles.approvedAt} < ${tomorrow.toISOString()}`,
  ];

  if (excludeArticleId) {
    conditions.push(ne(articles.id, excludeArticleId));
  }

  const result = await db
    .select({
      category: articles.articleCategory,
      count: count(),
    })
    .from(articles)
    .where(and(...conditions))
    .groupBy(articles.articleCategory);

  const counts: Record<string, number> = {};
  for (const row of result) {
    if (row.category) {
      counts[row.category] = row.count;
    }
  }
  return counts;
}

async function logAdminAction(
  status: AdminHistoryStatus,
  actionDescription?: string
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  await db.insert(adminHistory).values({
    status,
    actionDescription: actionDescription || null,
    createdBy: user.id,
  });
}

export async function approveArticle(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const rawFormData = {
    articleId: formData.get("articleId"),
  };

  const validatedFields = approveArticleSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return { error: "Invalid article ID" };
  }

  const { articleId } = validatedFields.data;

  try {
    // Get the article to check its category
    const article = await getArticleById(articleId);
    if (!article) {
      return { error: "Article not found" };
    }

    // Get current top news article ID to exclude from count
    const currentTopNewsArticleId = await getCurrentTopNewsArticleId();

    // Check if the category has reached its daily approval limit
    const approvedCount = await getApprovedCountForCategoryToday(
      article.articleCategory,
      currentTopNewsArticleId
    );
    if (approvedCount >= MAX_APPROVED_ARTICLES_PER_CATEGORY) {
      return {
        error: `Daily approval limit reached for category "${article.articleCategory}". Maximum ${MAX_APPROVED_ARTICLES_PER_CATEGORY} articles per category per day.`,
      };
    }

    await db
      .update(articles)
      .set({
        status: "approved_for_publishing",
        classification: "active",
        approvedAt: new Date(),
      })
      .where(eq(articles.id, articleId));

    await logAdminAction("ARTICLE_APPROVED", `Approved article: ${articleId}`);

    revalidatePath("/articles");
    revalidatePath(`/articles/${articleId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Article approved successfully" };
  } catch (error) {
    console.error("Error approving article:", error);
    return { error: "Failed to approve article" };
  }
}

export async function declineArticle(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const rawFormData = {
    articleId: formData.get("articleId"),
    reason: formData.get("reason") || undefined,
  };

  const validatedFields = declineArticleSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return { error: "Invalid form data" };
  }

  const { articleId, reason } = validatedFields.data;

  try {
    await db
      .update(articles)
      .set({
        status: "filtered_out",
        classification: "active",
        filteredOutReason: reason || null,
      })
      .where(eq(articles.id, articleId));

    await logAdminAction("ARTICLE_DECLINED", `Declined article: ${articleId}${reason ? ` - ${reason}` : ''}`);

    revalidatePath("/articles");
    revalidatePath(`/articles/${articleId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Article declined successfully" };
  } catch (error) {
    console.error("Error declining article:", error);
    return { error: "Failed to decline article" };
  }
}

export async function archiveArticle(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const rawFormData = {
    articleId: formData.get("articleId"),
  };

  const validatedFields = archiveArticleSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return { error: "Invalid article ID" };
  }

  const { articleId } = validatedFields.data;

  try {
    await db
      .update(articles)
      .set({
        classification: "archived",
      })
      .where(eq(articles.id, articleId));

    await logAdminAction("ARTICLE_ARCHIVED", `Archived article: ${articleId}`);

    revalidatePath("/articles");
    revalidatePath(`/articles/${articleId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Article archived successfully" };
  } catch (error) {
    console.error("Error archiving article:", error);
    return { error: "Failed to archive article" };
  }
}

export async function unapproveArticle(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const rawFormData = {
    articleId: formData.get("articleId"),
  };

  const validatedFields = unapproveArticleSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return { error: "Invalid article ID" };
  }

  const { articleId } = validatedFields.data;

  try {
    await db
      .update(articles)
      .set({
        status: "waiting_approval",
        approvedAt: null,
      })
      .where(eq(articles.id, articleId));

    await logAdminAction("ARTICLE_UNAPPROVED", `Unapproved article: ${articleId}`);

    revalidatePath("/articles");
    revalidatePath(`/articles/${articleId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Article unapproved successfully" };
  } catch (error) {
    console.error("Error unapproving article:", error);
    return { error: "Failed to unapprove article" };
  }
}

export async function bulkAction(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const articleIdsStr = formData.get("articleIds") as string;
  const action = formData.get("action") as string;
  const reasonValue = formData.get("reason");
  const reason = reasonValue ? String(reasonValue) : undefined;

  const rawFormData = {
    articleIds: articleIdsStr ? JSON.parse(articleIdsStr) : [],
    action,
    reason,
  };

  const validatedFields = bulkActionSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0]?.message || "Invalid form data" };
  }

  const { articleIds } = validatedFields.data;

  try {
    let updateData: {
      status?: ArticleStatus;
      classification?: ArticleClassification;
      filteredOutReason?: string | null;
      approvedAt?: Date | null;
    };
    let historyStatus: AdminHistoryStatus;
    let idsToUpdate = articleIds;

    switch (action) {
      case "approve": {
        // For bulk approve, check category limits
        const articlesToApprove = await db
          .select()
          .from(articles)
          .where(inArray(articles.id, articleIds));

        // Get current top news article ID to exclude from counts
        const currentTopNewsArticleId = await getCurrentTopNewsArticleId();

        // Group articles by category and check limits
        const categoryGroups: Record<string, string[]> = {};
        for (const article of articlesToApprove) {
          const cat = article.articleCategory || "uncategorized";
          if (!categoryGroups[cat]) {
            categoryGroups[cat] = [];
          }
          categoryGroups[cat].push(article.id);
        }

        // Check each category's current count and filter articles
        const approvableIds: string[] = [];
        const skippedCategories: string[] = [];

        for (const [category, ids] of Object.entries(categoryGroups)) {
          const currentCount = await getApprovedCountForCategoryToday(
            category === "uncategorized" ? null : category,
            currentTopNewsArticleId
          );
          const availableSlots = MAX_APPROVED_ARTICLES_PER_CATEGORY - currentCount;

          if (availableSlots <= 0) {
            skippedCategories.push(category);
          } else {
            // Only approve up to the available slots
            approvableIds.push(...ids.slice(0, availableSlots));
            if (ids.length > availableSlots) {
              skippedCategories.push(category);
            }
          }
        }

        if (approvableIds.length === 0) {
          return {
            error: `Cannot approve any articles. Daily limit (${MAX_APPROVED_ARTICLES_PER_CATEGORY}) reached for all selected categories.`,
          };
        }

        idsToUpdate = approvableIds;
        updateData = {
          status: "approved_for_publishing",
          classification: "active",
          approvedAt: new Date(),
        };
        historyStatus = "ARTICLE_APPROVED";
        break;
      }
      case "decline":
        updateData = {
          status: "filtered_out",
          classification: "active",
          filteredOutReason: reason || null,
        };
        historyStatus = "ARTICLE_DECLINED";
        break;
      case "archive":
        updateData = {
          classification: "archived",
        };
        historyStatus = "ARTICLE_ARCHIVED";
        break;
      case "unapprove":
        updateData = {
          status: "waiting_approval",
          approvedAt: null,
        };
        historyStatus = "ARTICLE_UNAPPROVED";
        break;
      default:
        return { error: "Invalid action" };
    }

    await db
      .update(articles)
      .set(updateData)
      .where(inArray(articles.id, idsToUpdate));

    // Log each article individually
    const actionVerb = {
      approve: "Approved",
      decline: "Declined",
      archive: "Archived",
      unapprove: "Unapproved",
    }[action] || action;

    for (const articleId of idsToUpdate) {
      const description = reason
        ? `${actionVerb} article: ${articleId} - ${reason}`
        : `${actionVerb} article: ${articleId}`;
      await logAdminAction(historyStatus, description);
    }

    revalidatePath("/articles");
    revalidatePath("/dashboard");

    const skippedCount = articleIds.length - idsToUpdate.length;
    let message = `${idsToUpdate.length} articles ${action}d successfully`;
    if (skippedCount > 0) {
      message += `. ${skippedCount} articles skipped due to daily category limits.`;
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return { error: "Failed to perform bulk action" };
  }
}

export async function promoteToTopNews(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const rawFormData = {
    articleId: formData.get("articleId"),
    position: formData.get("position")
      ? parseInt(formData.get("position") as string)
      : undefined,
  };

  const validatedFields = promoteToTopNewsSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return { error: "Invalid form data" };
  }

  const { articleId } = validatedFields.data;

  try {
    // Get the article details
    const article = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);

    if (!article || article.length === 0) {
      return { error: "Article not found" };
    }

    const articleData = article[0];

    // Check if this article is already the current top non-sponsored news
    const currentTopArticleId = await getCurrentTopNewsArticleId();
    if (currentTopArticleId === articleId) {
      return { error: "Article is already today's top news" };
    }

    await db.insert(topNewsItems).values({
      title: articleData.title || "Untitled",
      sourceUrl: articleData.sourceUrl,
      articleId: articleId,
      articleThumbnailLink: articleData.articleThumbnailLink,
      summary: articleData.aiGeneratedNewsletterSummary,
      sourceName: articleData.sourceName,
      createdBy: user.id,
      updatedBy: user.id,
      approvedBy: user.id,
      approvedAt: new Date(),
    });

    await logAdminAction("ARTICLE_PROMOTED_TOPNEWS", `Promoted article to top news: ${articleId}`);

    revalidatePath("/articles");
    revalidatePath("/top-news");
    revalidatePath("/dashboard");

    return { success: true, message: "Article promoted to top news" };
  } catch (error) {
    console.error("Error promoting to top news:", error);
    return { error: "Failed to promote article" };
  }
}

export async function removeFromTopNews(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const topNewsId = formData.get("topNewsId") as string;

  if (!topNewsId) {
    return { error: "Invalid top news item ID" };
  }

  try {
    const item = await db
      .select()
      .from(topNewsItems)
      .where(eq(topNewsItems.uuid, topNewsId))
      .limit(1);

    if (!item || item.length === 0) {
      return { error: "Top news item not found" };
    }

    await db
      .delete(topNewsItems)
      .where(eq(topNewsItems.uuid, topNewsId));

    await logAdminAction("GENERAL_ACTION", `Removed article from top news: ${item[0].articleId || 'unknown'}`);

    revalidatePath("/top-news");
    revalidatePath("/dashboard");

    return { success: true, message: "Article removed from top news" };
  } catch (error) {
    console.error("Error removing from top news:", error);
    return { error: "Failed to remove article from top news" };
  }
}

export async function updateArticle(
  prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const rawFormData = {
    articleId: formData.get("articleId"),
    title: formData.get("title") || undefined,
    summary: formData.get("summary") || undefined,
    newsletterSummary: formData.get("newsletterSummary") || undefined,
    content: formData.get("content") || undefined,
    articleCategory: formData.get("articleCategory") || undefined,
  };

  const validatedFields = updateArticleSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return { error: "Invalid form data" };
  }

  const { articleId, ...updateData } = validatedFields.data;

  try {
    const cleanedData: Record<string, unknown> = {};
    if (updateData.title) cleanedData.title = updateData.title;
    if (updateData.summary) cleanedData.chatgptSummary = updateData.summary;
    if (updateData.newsletterSummary) cleanedData.aiGeneratedNewsletterSummary = updateData.newsletterSummary;
    if (updateData.content) cleanedData.rawContentSnippet = updateData.content;
    if (updateData.articleCategory)
      cleanedData.articleCategory = updateData.articleCategory;

    await db.update(articles).set(cleanedData).where(eq(articles.id, articleId));

    const changes = Object.keys(cleanedData).join(', ');
    await logAdminAction("ARTICLE_EDITED", `Updated article ${articleId}: ${changes}`);

    revalidatePath("/articles");
    revalidatePath(`/articles/${articleId}`);

    return { success: true, message: "Article updated successfully" };
  } catch (error) {
    console.error("Error updating article:", error);
    return { error: "Failed to update article" };
  }
}

export async function getTopNewsItems() {
  const items = await db.query.topNewsItems.findMany({
    with: {
      article: true,
      sponsor: true,
      creator: true,
      approver: true,
    },
    orderBy: [desc(topNewsItems.updatedAt)],
  });

  return items;
}

/**
 * Get today's featured top news items:
 * - One non-sponsored item (most recent today with is_sponsored=false and article_id set)
 * - One sponsored item (most recent today with is_sponsored=true and sponsor_id set)
 */
export async function getTodaysTopNews() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get the most recent non-sponsored top news for today
  const nonSponsoredItem = await db.query.topNewsItems.findFirst({
    with: {
      article: true,
      creator: true,
      approver: true,
    },
    where: and(
      eq(topNewsItems.isSponsored, false),
      sql`${topNewsItems.articleId} IS NOT NULL`,
      sql`${topNewsItems.updatedAt} >= ${today.toISOString()}`,
      sql`${topNewsItems.updatedAt} < ${tomorrow.toISOString()}`
    ),
    orderBy: [desc(topNewsItems.updatedAt)],
  });

  // Get the most recent sponsored top news (permanent — not date-filtered)
  const sponsoredItem = await db.query.topNewsItems.findFirst({
    with: {
      sponsor: true,
      creator: true,
      approver: true,
    },
    where: and(
      eq(topNewsItems.isSponsored, true),
      sql`${topNewsItems.sponsorId} IS NOT NULL`,
    ),
    orderBy: [desc(topNewsItems.updatedAt)],
  });

  return {
    nonSponsored: nonSponsoredItem || null,
    sponsored: sponsoredItem || null,
  };
}

/**
 * Get the current top news article ID (non-sponsored) for today
 */
export async function getCurrentTopNewsArticleId(): Promise<string | null> {
  const todaysNews = await getTodaysTopNews();
  return todaysNews.nonSponsored?.articleId || null;
}

/**
 * Get the current top news sponsor ID for today
 */
export async function getCurrentTopNewsSponsorId(): Promise<string | null> {
  const todaysNews = await getTodaysTopNews();
  return todaysNews.sponsored?.sponsorId || null;
}

export async function getArticleStats() {
  try {
    const stats = await db
      .select({
        status: articles.status,
        classification: articles.classification,
        count: count(),
      })
      .from(articles)
      .groupBy(articles.status, articles.classification);

    const categoryStats = await db
      .select({
        category: articles.articleCategory,
        count: count(),
      })
      .from(articles)
      .where(eq(articles.status, "waiting_approval"))
      .groupBy(articles.articleCategory);

    const avgAiScore = await db
      .select({
        avg: sql<number>`AVG(${articles.aiAnalyzerTotalScore})`,
      })
      .from(articles)
      .where(eq(articles.status, "waiting_approval"));

    const { today } = getAppDayRange();
    const cutoffDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const declinedResult = await db
      .select({ count: count() })
      .from(articles)
      .where(
        and(
          eq(articles.status, "filtered_out"),
          sql`${articles.classification} != 'archived'`,
          sql`${articles.aggregatedAt} >= ${cutoffDate.toISOString()}`
        )
      );

    return {
      byStatusAndClassification: stats,
      pendingByCategory: categoryStats,
      avgPendingAiScore: avgAiScore[0]?.avg || 0,
      declinedCount: declinedResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching article stats:", error);
    return {
      byStatusAndClassification: [],
      pendingByCategory: [],
      avgPendingAiScore: 0,
    };
  }
}
