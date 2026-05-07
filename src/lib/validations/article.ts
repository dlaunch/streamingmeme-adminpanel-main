import { z } from "zod";

export const articleFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["pending_analysis", "for_categorization", "for_verification", "waiting_approval", "approved_for_publishing", "filtered_out"]).optional(),
  classification: z.enum(["active", "archived"]).optional(),
  sortBy: z.enum(["title", "created_at", "original_publish_date", "ai_score", "article_category"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const approveArticleSchema = z.object({
  articleId: z.string().uuid(),
});

export const declineArticleSchema = z.object({
  articleId: z.string().uuid(),
  reason: z.string().optional(),
});

export const archiveArticleSchema = z.object({
  articleId: z.string().uuid(),
});

export const unapproveArticleSchema = z.object({
  articleId: z.string().uuid(),
});

export const bulkActionSchema = z.object({
  articleIds: z.array(z.string().uuid()).min(1, "Select at least one article"),
  action: z.enum(["approve", "decline", "archive", "unapprove"]),
  reason: z.string().optional(),
});

export const promoteToTopNewsSchema = z.object({
  articleId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
});

export const updateArticleSchema = z.object({
  articleId: z.string().uuid(),
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  newsletterSummary: z.string().optional(),
  content: z.string().optional(),
  articleCategory: z.string().optional(),
});

export type ArticleFilterFormData = z.infer<typeof articleFilterSchema>;
export type ApproveArticleFormData = z.infer<typeof approveArticleSchema>;
export type DeclineArticleFormData = z.infer<typeof declineArticleSchema>;
export type ArchiveArticleFormData = z.infer<typeof archiveArticleSchema>;
export type UnapproveArticleFormData = z.infer<typeof unapproveArticleSchema>;
export type BulkActionFormData = z.infer<typeof bulkActionSchema>;
export type PromoteToTopNewsFormData = z.infer<typeof promoteToTopNewsSchema>;
export type UpdateArticleFormData = z.infer<typeof updateArticleSchema>;
