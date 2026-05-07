import {
  pgTable,
  pgView,
  uuid,
  text,
  varchar,
  timestamp,
  date,
  boolean,
  integer,
  jsonb,
  pgEnum,
  bigserial,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============ ENUMS ============

export const adminHistoryStatusEnum = pgEnum("admin_history_status", [
  "GENERAL_ACTION",
  "ARTICLE_APPROVED",
  "ARTICLE_PROMOTED_TOPNEWS",
  "ARTICLE_DECLINED",
  "ARTICLE_ARCHIVED",
  "ARTICLE_EDITED",
  "ARTICLE_UNAPPROVED",
  "SPONSOR_PROMOTED_TOPNEWS",
]);

export const articleEventTypeEnum = pgEnum("article_event_type", [
  "MERGERS_AND_ACQUISITIONS",
  "EARNINGS_REPORTS",
  "EXECUTIVE_CHANGES",
  "PRODUCT_LAUNCH",
  "STRATEGIC_PARTNERSHIP",
  "REGULATORY_ACTION",
  "FUNDING_ROUND",
  "INDUSTRY_TREND",
  "TECHNICAL_DEVELOPMENT",
  "CONTENT_LICENSING",
  "OTHER",
]);

export const newsCategoriesEnum = pgEnum("news_categories_new", [
  "ENCODING_AND_SOFTWARE",
  "VIDEO_DELIVERY_AND_CDN",
  "VIDEO_STREAMING_AND_DELIVERY_PLATFORMS",
  "ARTIFICIAL_INTELLIGENCE_FOR_VIDEO_APPLICATIONS",
  "PRODUCTION_HARDWARE",
  "BUSINESS_NEWS",
  "MONETIZATION_AND_AD_TECH",
  "REGULATORY_AND_POLICY",
]);

export const newsCategoriesLegacyEnum = pgEnum("news_categories", [
  "TODAYS_NEWS",
  "TOMORROWS_EVENTS",
  "ENCODING_AND_SOFTWARE",
  "DELIVERY",
  "PLATFORMS",
  "ARTIFICIAL_INTELLIGENCE",
  "PRODUCTION_HARDWARE",
  "BUSINESS_NEWS",
  "INDUSTRY_VOICES",
]);

export const newsletterGenerationJobStatusEnum = pgEnum("newsletter_generation_job_status", [
  "GENERATE_JOB_PENDING",
  "GENERATE_JOB_RUNNING",
  "GENERATE_JOB_SUCCESS",
  "GENERATE_JOB_FAILED",
  "GENERATE_JOB_CANCELLED",
  "GENERATE_JOB_PUBLISHED",
]);

// ============ TABLES ============

export const adminHistory = pgTable("admin_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actionDescription: text("action_description"),
  status: adminHistoryStatusEnum("status"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

export const appConfigs = pgTable("app_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  appName: text("app_name"),
  appWorkflowName: text("app_workflow_name"),
  preferredAiModel: varchar("preferred_ai_model"),
  appCode: text("app_code"),
});

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  aggregatedAt: timestamp("aggregated_at", { withTimezone: true }).defaultNow().notNull(),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  title: text("title"),
  originalPublishDate: date("original_publish_date", { mode: "date" }),
  rawContentSnippet: text("raw_content_snippet"),
  chatgptSummary: text("chatgpt_summary"),
  chatgptSuggestedHeadlines: text("chatgpt_suggested_headlines"),
  curatedHeadline: text("curated_headline"),
  curationNotes: text("curation_notes"),
  status: text("status"),
  categoryTags: text("category_tags"),
  websitePostId: text("website_post_id"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sourceType: text("source_type"),
  sourceId: uuid("source_id"),
  articleThumbnailLink: text("article_thumbnail_link"),
  articleThumbnailLinkStatus: text("article_thumbnail_link_status"),
  aiAnalyzerTotalScore: integer("ai_analyzer_total_score").default(0),
  classification: text("classification").default("active"),
  ibcRelevanceScore: integer("ibc_relevance_score").default(0),
  strategicImpactScore: integer("strategic_impact_score").default(0),
  primaryCategoryScore: integer("primary_category_score").default(0),
  sourceQualityScore: integer("source_quality_score").default(0),
  crossIndustryImpactScore: integer("cross_industry_impact_score").default(0),
  sourceTier: text("source_tier"),
  analysisData: jsonb("analysis_data"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
  filteredOutReason: text("filtered_out_reason"),
  articleCategory: newsCategoriesEnum("article_category"),
  alsoQualifiesForTodaysNews: boolean("also_qualifies_for_todays_news").default(false),
  makeHeadline: boolean("make_headline").default(false),
  perplexityConfidenceScore: text("perplexity_confidence_score"),
  perplexityReasonForInclusion: text("perplexity_reason_for_inclusion"),
  perplexityEventType: text("perplexity_event_type"),
  perplexityCategory: text("perplexity_category"),
  relevanceScore: integer("relevance_score").default(0).notNull(),
  eventType: articleEventTypeEnum("event_type"),
  impactScore: integer("impact_score").default(0),
  aiGeneratedNewsletterSummary: text("ai_generated_newsletter_summary"),
  keyTakeaways: text("key_takeaways").array(),
  whyItMatters: text("why_it_matters"),
  markedReadBy: uuid("marked_read_by"),
  markedReadAt: timestamp("marked_read_at", { withTimezone: true }),
  referenceArticleId: uuid("reference_article_id"),
  articleSlug: text("article_slug"),
});

export const companyMasterList = pgTable("company_master_list", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name"),
  websiteUrl: text("website_url"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  address: text("address"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  logoUrl: text("logo_url"),
  screenshotUrl: text("screenshot_url"),
  rssFeed: text("rss_feed"),
  blogUrl: text("blog_url"),
  productCategory: text("product_category"),
  products: jsonb("products"),
  companyDescription: text("company_description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const googleCalendarEvents = pgTable("google_calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleEventId: text("google_event_id").notNull().unique(),
  calendarId: text("calendar_id"),
  summary: text("summary"),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  isAllDay: boolean("is_all_day").default(false),
  status: text("status"),
  organizerEmail: text("organizer_email"),
  htmlLink: text("html_link"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const newsletterGenerationJobs = pgTable("newsletter_generation_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  newsletterId: uuid("newsletter_id"),
  status: newsletterGenerationJobStatusEnum("status"),
  progress: integer("progress").default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  htmlContent: text("html_content"),
  newsletterSubject: text("newsletter_subject"),
  newsletterSubtitle: text("newsletter_subtitle"),
});

export const newsletterTemplateParts = pgTable("newsletter_template_parts", {
  id: uuid("id").defaultRandom().primaryKey(),
  newsletterTemplateId: uuid("newsletter_template_id").notNull(),
  htmlPart: text("html_part").notNull(),
  htmlText: text("html_text").notNull(),
  version: integer("version").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  placeholders: jsonb("placeholders").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const newsletters = pgTable("newsletters", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  currentVersion: integer("current_version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nvidiaMonitorThreads = pgTable("nvidia_monitor_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: text("thread_id").notNull(),
  source: text("source").notNull(),
  title: text("title"),
  fullText: text("full_text"),
  author: text("author"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  url: text("url"),
  category: text("category"),
  tier1Match: boolean("tier1_match").default(false),
  tier2Match: boolean("tier2_match").default(false),
  relevanceScore: integer("relevance_score"),
  categoryTag: text("category_tag"),
  priority: text("priority"),
  aiReason: text("ai_reason"),
  slackNotified: boolean("slack_notified").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  threadIdSourceUnique: unique("nvidia_monitor_threads_thread_id_source_key").on(table.threadId, table.source),
}));

export const scheduleExecutions = pgTable("schedule_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceScheduleId: uuid("source_schedule_id").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").default("pending").notNull(),
  articlesScraped: integer("articles_scraped").default(0),
  errorMessage: text("error_message"),
  executionMetadata: jsonb("execution_metadata"),
  n8nExecutionId: text("n8n_execution_id"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const schedulePatterns = pgTable("schedule_patterns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cronExpression: text("cron_expression"),
  frequencyType: text("frequency_type").notNull(),
  frequencyValue: integer("frequency_value"),
  dayOfWeek: integer("day_of_week").array(),
  dayOfMonth: integer("day_of_month").array(),
  weekOfMonth: integer("week_of_month").array(),
  hourOfDay: integer("hour_of_day").default(9),
  minuteOfHour: integer("minute_of_hour").default(0),
  timezone: text("timezone").default("UTC"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sourceSchedules = pgTable("source_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").notNull(),
  schedulePatternId: uuid("schedule_pattern_id").notNull(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1),
  maxRetryAttempts: integer("max_retry_attempts").default(3),
  retryDelayMinutes: integer("retry_delay_minutes").default(30),
  timeoutMinutes: integer("timeout_minutes").default(15),
  customConfig: jsonb("custom_config"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  sourceType: text("source_type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  scraperConfig: jsonb("scraper_config"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sponsors = pgTable("sponsors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  headline: text("headline"),
  blurb: text("blurb"),
  ctaText: text("cta_text"),
  ctaUrl: text("cta_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  underNewsCategory: newsCategoriesEnum("under_news_category"),
  newsletterId: uuid("newsletter_id"),
  sectionColor: text("section_color").default("#808080"),
});

export const topNewsItems = pgTable("top_news_items", {
  uuid: uuid("uuid").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  articleId: uuid("article_id"),
  articleThumbnailLink: text("article_thumbnail_link"),
  summary: text("summary"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  isSponsored: boolean("is_sponsored").default(false).notNull(),
  sourceName: text("source_name"),
  sponsorUrl: text("sponsor_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by"),
  approvedBy: uuid("approved_by"),
  sponsorId: uuid("sponsor_id"),
});

export const userProfileRoles = pgTable(
  "user_profile_roles",
  {
    userId: uuid("user_id")
      .references(() => userProfiles.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => userRoles.id, { onDelete: "restrict" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  })
);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleKey: text("role_key").notNull().unique(),
  roleName: text("role_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSubmittedArticles = pgTable("user_submitted_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  submittedUrl: text("submitted_url").notNull().unique(),
  submittedCategory: text("submitted_category").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  userEmail: text("user_email"),
  userIpAddress: text("user_ip_address"),
  articleTitle: text("article_title"),
  articleSourceName: text("article_source_name"),
  articleContentPreview: text("article_content_preview"),
  articleFullContent: text("article_full_content"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
  validationStatus: text("validation_status").default("pending"),
  validationConfidence: integer("validation_confidence"),
  validationReason: text("validation_reason"),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  aiRelevanceScore: integer("ai_relevance_score"),
  aiImpactScore: integer("ai_impact_score"),
  aiCategory: text("ai_category"),
  aiSummary: text("ai_summary"),
  aiAnalysisData: jsonb("ai_analysis_data"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
  adminReviewed: boolean("admin_reviewed").default(false),
  adminNotes: text("admin_notes"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  articleId: uuid("article_id"),
  promotedToMain: boolean("promoted_to_main").default(false),
  promotedAt: timestamp("promoted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const vnovaArticles = pgTable("vnova_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  aggregatedAt: timestamp("aggregated_at", { withTimezone: true }).defaultNow().notNull(),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  title: text("title"),
  originalPublishDate: date("original_publish_date", { mode: "date" }),
  rawContentSnippet: text("raw_content_snippet"),
  chatgptSummary: text("chatgpt_summary"),
  chatgptSuggestedHeadlines: text("chatgpt_suggested_headlines"),
  curatedHeadline: text("curated_headline"),
  curationNotes: text("curation_notes"),
  status: text("status"),
  categoryTags: text("category_tags"),
  websitePostId: text("website_post_id"),
  newsletterInclusionDate: date("newsletter_inclusion_date", { mode: "date" }),
  sourceType: text("source_type"),
  sourceId: uuid("source_id"),
  articleThumbnailLink: text("article_thumbnail_link"),
  articleThumbnailLinkStatus: text("article_thumbnail_link_status"),
  aiAnalyzerTotalScore: integer("ai_analyzer_total_score").default(0),
  classification: text("classification").default("pending"),
  ibcRelevanceScore: integer("ibc_relevance_score").default(0),
  strategicImpactScore: integer("strategic_impact_score").default(0),
  primaryCategoryScore: integer("primary_category_score").default(0),
  sourceQualityScore: integer("source_quality_score").default(0),
  crossIndustryImpactScore: integer("cross_industry_impact_score").default(0),
  sourceTier: text("source_tier"),
  analysisData: jsonb("analysis_data"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: false }),
  filteredOutReason: text("filtered_out_reason"),
  articleCategory: newsCategoriesLegacyEnum("article_category"),
  alsoQualifiesForTodaysNews: boolean("also_qualifies_for_todays_news").default(false),
  makeHeadline: boolean("make_headline").default(false),
  perplexityConfidenceScore: text("perplexity_confidence_score"),
  perplexityReasonForInclusion: text("perplexity_reason_for_inclusion"),
  perplexityEventType: text("perplexity_event_type"),
  perplexityCategory: text("perplexity_category"),
  linkedinArticleAnalyzedStatus: text("linkedin_article_analyzed_status").default(""),
  postStatus: text("post_status"),
  detectedKeywords: text("detected_keywords"),
  linkedinCaption: text("linkedin_caption"),
});

export const articlePublishHistory = pgTable("article_publish_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  articleId: uuid("article_id"),
});

export const sponsorPublishHistory = pgTable("sponsor_publish_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  sponsorId: uuid("sponsor_id"),
  logoUrl: text("logo_url"),
  headline: text("headline"),
  blurb: text("blurb"),
  underNewsCategory: newsCategoriesEnum("under_news_category"),
});

// ============ VIEWS ============

export const pendingExecutions = pgView("pending_executions", {
  executionId: uuid("execution_id"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status"),
  retryCount: integer("retry_count"),
  sourceId: uuid("source_id"),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  sourceType: text("source_type"),
  scraperConfig: jsonb("scraper_config"),
  priority: integer("priority"),
  maxRetryAttempts: integer("max_retry_attempts"),
  timeoutMinutes: integer("timeout_minutes"),
  scheduleName: text("schedule_name"),
}).existing();

// ============ RELATIONS ============

export const articlesRelations = relations(articles, ({ many }) => ({
  topNewsItems: many(topNewsItems),
}));

export const topNewsItemsRelations = relations(topNewsItems, ({ one }) => ({
  article: one(articles, {
    fields: [topNewsItems.articleId],
    references: [articles.id],
  }),
  sponsor: one(sponsors, {
    fields: [topNewsItems.sponsorId],
    references: [sponsors.id],
  }),
  creator: one(userProfiles, {
    fields: [topNewsItems.createdBy],
    references: [userProfiles.id],
  }),
  updater: one(userProfiles, {
    fields: [topNewsItems.updatedBy],
    references: [userProfiles.id],
  }),
  approver: one(userProfiles, {
    fields: [topNewsItems.approvedBy],
    references: [userProfiles.id],
  }),
}));

export const adminHistoryRelations = relations(adminHistory, ({ one }) => ({
  creator: one(userProfiles, {
    fields: [adminHistory.createdBy],
    references: [userProfiles.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  roles: many(userProfileRoles),
  topNewsItems: many(topNewsItems),
  adminHistory: many(adminHistory),
}));

export const userRolesRelations = relations(userRoles, ({ many }) => ({
  userProfiles: many(userProfileRoles),
}));

export const userProfileRolesRelations = relations(userProfileRoles, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userProfileRoles.userId],
    references: [userProfiles.id],
  }),
  role: one(userRoles, {
    fields: [userProfileRoles.roleId],
    references: [userRoles.id],
  }),
}));

export const newsletterGenerationJobsRelations = relations(newsletterGenerationJobs, ({ one }) => ({
  newsletter: one(newsletters, {
    fields: [newsletterGenerationJobs.newsletterId],
    references: [newsletters.id],
  }),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  schedules: many(sourceSchedules),
}));

export const sourceSchedulesRelations = relations(sourceSchedules, ({ one, many }) => ({
  source: one(sources, {
    fields: [sourceSchedules.sourceId],
    references: [sources.id],
  }),
  schedulePattern: one(schedulePatterns, {
    fields: [sourceSchedules.schedulePatternId],
    references: [schedulePatterns.id],
  }),
  executions: many(scheduleExecutions),
}));

export const scheduleExecutionsRelations = relations(scheduleExecutions, ({ one }) => ({
  sourceSchedule: one(sourceSchedules, {
    fields: [scheduleExecutions.sourceScheduleId],
    references: [sourceSchedules.id],
  }),
}));

// ============ TYPE EXPORTS ============

export type CompanyMasterList = typeof companyMasterList.$inferSelect;
export type NewCompanyMasterList = typeof companyMasterList.$inferInsert;
export type AdminHistoryRecord = typeof adminHistory.$inferSelect;
export type NewAdminHistoryRecord = typeof adminHistory.$inferInsert;
export type AppConfig = typeof appConfigs.$inferSelect;
export type NewAppConfig = typeof appConfigs.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type GoogleCalendarEvent = typeof googleCalendarEvents.$inferSelect;
export type NewGoogleCalendarEvent = typeof googleCalendarEvents.$inferInsert;
export type Newsletter = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;
export type NewsletterGenerationJob = typeof newsletterGenerationJobs.$inferSelect;
export type NewNewsletterGenerationJob = typeof newsletterGenerationJobs.$inferInsert;
export type NewsletterTemplatePart = typeof newsletterTemplateParts.$inferSelect;
export type NewNewsletterTemplatePart = typeof newsletterTemplateParts.$inferInsert;
export type ScheduleExecution = typeof scheduleExecutions.$inferSelect;
export type NewScheduleExecution = typeof scheduleExecutions.$inferInsert;
export type SchedulePattern = typeof schedulePatterns.$inferSelect;
export type NewSchedulePattern = typeof schedulePatterns.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type SourceSchedule = typeof sourceSchedules.$inferSelect;
export type NewSourceSchedule = typeof sourceSchedules.$inferInsert;
export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type TopNewsItem = typeof topNewsItems.$inferSelect;
export type NewTopNewsItem = typeof topNewsItems.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserProfileRole = typeof userProfileRoles.$inferSelect;
export type UserRoleRecord = typeof userRoles.$inferSelect;
export type UserSubmittedArticle = typeof userSubmittedArticles.$inferSelect;
export type NewUserSubmittedArticle = typeof userSubmittedArticles.$inferInsert;
export type VnovaArticle = typeof vnovaArticles.$inferSelect;
export type NewVnovaArticle = typeof vnovaArticles.$inferInsert;
export type NvidiaMonitorThread = typeof nvidiaMonitorThreads.$inferSelect;
export type NewNvidiaMonitorThread = typeof nvidiaMonitorThreads.$inferInsert;
export type ArticlePublishHistory = typeof articlePublishHistory.$inferSelect;
export type NewArticlePublishHistory = typeof articlePublishHistory.$inferInsert;
export type SponsorPublishHistory = typeof sponsorPublishHistory.$inferSelect;
export type NewSponsorPublishHistory = typeof sponsorPublishHistory.$inferInsert;
