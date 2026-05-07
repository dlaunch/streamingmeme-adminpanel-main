"use server";

import { db } from "@/lib/db";
import { newsletters, newsletterGenerationJobs } from "@/lib/db/schema";
import { eq, desc, or, and, gte, lt } from "drizzle-orm";
import { getUser } from "./auth";

export type NewsletterActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  jobId?: string;
};

export async function getActiveNewsletter() {
  try {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const slug = dayOfWeek === 0 || dayOfWeek === 6 ? "streamingmeme-missednews" : "streamingmeme";

    const result = await db
      .select()
      .from(newsletters)
      .where(and(eq(newsletters.slug, slug), eq(newsletters.isActive, true)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching active newsletter:", error);
    return null;
  }
}

export async function createNewsletterGenerationJob(
  newsletterId: string
): Promise<NewsletterActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Use raw SQL to avoid potential enum type resolution issues with connection pooling
    const result = await db.execute<{ id: string }>(
      `INSERT INTO newsletter_generation_jobs (newsletter_id, status)
       VALUES ('${newsletterId}', 'GENERATE_JOB_PENDING')
       RETURNING id`
    );

    if (!result[0]) {
      return { error: "Failed to create newsletter generation job" };
    }

    return {
      success: true,
      message: "Newsletter generation job created",
      jobId: result[0].id,
    };
  } catch (error: unknown) {
    console.error("Error creating newsletter generation job - Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));

    // Extract PostgreSQL error details if available
    const pgError = error as { code?: string; detail?: string; message?: string; constraint?: string };
    const errorDetails = [
      pgError.message,
      pgError.code ? `Code: ${pgError.code}` : null,
      pgError.detail ? `Detail: ${pgError.detail}` : null,
      pgError.constraint ? `Constraint: ${pgError.constraint}` : null,
    ].filter(Boolean).join(' | ');

    return { error: `Failed to create newsletter generation job: ${errorDetails || "Unknown error"}` };
  }
}

export async function getNewsletterGenerationJobStatus(jobId: string): Promise<{
  job: {
    id: string;
    status: string | null;
    htmlContent: string | null;
    errorMessage: string | null;
    finishedAt: Date | null;
  } | null;
  error?: string;
}> {
  try {
    const result = await db
      .select({
        id: newsletterGenerationJobs.id,
        status: newsletterGenerationJobs.status,
        htmlContent: newsletterGenerationJobs.htmlContent,
        errorMessage: newsletterGenerationJobs.errorMessage,
        finishedAt: newsletterGenerationJobs.finishedAt,
      })
      .from(newsletterGenerationJobs)
      .where(eq(newsletterGenerationJobs.id, jobId))
      .limit(1);

    return { job: result[0] || null };
  } catch (error) {
    console.error("Error fetching newsletter generation job:", error);
    return { job: null, error: String(error) };
  }
}

export async function triggerNewsletterGenerationWebhook(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const response = await fetch(
      `https://d-launch.app.n8n.cloud/webhook/2e6e4716-bd6c-4d5a-a27c-d7d94f8269sm?uuid=${jobId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      }
    );

    if (!response.ok) {
      const errorMsg = `Webhook returned status ${response.status}`;
      console.error("Newsletter webhook error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (error) {
    console.error("Error calling newsletter generation webhook:", error);
    return { success: false, error: "Failed to trigger webhook" };
  }
}

type GenerationJobInfo = {
  id: string;
  status: string | null;
  htmlContent: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
};

/**
 * Get today's generation job status for the dashboard.
 * Uses started_at to determine if a job is from today.
 * Returns:
 * - ongoingJob: Any PENDING or RUNNING job from today (should disable button and track)
 * - latestSuccessJob: The latest SUCCESS job from today (should show preview link)
 */
export async function getTodaysGenerationJobStatus(): Promise<{
  ongoingJob: GenerationJobInfo | null;
  latestSuccessJob: GenerationJobInfo | null;
  isPublishedToday: boolean;
  error?: string;
}> {
  try {
    // Compute local-time midnight boundaries so "today" means the user's calendar day,
    // not UTC midnight (which can differ by several hours from local time).
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Query for ongoing jobs (PENDING or RUNNING) from today
    const ongoingResult = await db
      .select({
        id: newsletterGenerationJobs.id,
        status: newsletterGenerationJobs.status,
        htmlContent: newsletterGenerationJobs.htmlContent,
        errorMessage: newsletterGenerationJobs.errorMessage,
        startedAt: newsletterGenerationJobs.startedAt,
        finishedAt: newsletterGenerationJobs.finishedAt,
      })
      .from(newsletterGenerationJobs)
      .where(
        and(
          or(
            eq(newsletterGenerationJobs.status, "GENERATE_JOB_PENDING"),
            eq(newsletterGenerationJobs.status, "GENERATE_JOB_RUNNING")
          ),
          gte(newsletterGenerationJobs.startedAt, todayStart),
          lt(newsletterGenerationJobs.startedAt, tomorrowStart)
        )
      )
      .orderBy(desc(newsletterGenerationJobs.startedAt))
      .limit(1);

    console.log("[getTodaysGenerationJobStatus] Ongoing job query result:", ongoingResult);

    // Query for the latest successful or published job from today
    const successResult = await db
      .select({
        id: newsletterGenerationJobs.id,
        status: newsletterGenerationJobs.status,
        htmlContent: newsletterGenerationJobs.htmlContent,
        errorMessage: newsletterGenerationJobs.errorMessage,
        startedAt: newsletterGenerationJobs.startedAt,
        finishedAt: newsletterGenerationJobs.finishedAt,
      })
      .from(newsletterGenerationJobs)
      .where(
        and(
          or(
            eq(newsletterGenerationJobs.status, "GENERATE_JOB_SUCCESS"),
            eq(newsletterGenerationJobs.status, "GENERATE_JOB_PUBLISHED")
          ),
          gte(newsletterGenerationJobs.startedAt, todayStart),
          lt(newsletterGenerationJobs.startedAt, tomorrowStart)
        )
      )
      .orderBy(desc(newsletterGenerationJobs.startedAt))
      .limit(1);

    console.log("[getTodaysGenerationJobStatus] Success job query result:", {
      found: successResult.length > 0,
      id: successResult[0]?.id,
      status: successResult[0]?.status,
      hasHtmlContent: !!successResult[0]?.htmlContent,
      htmlContentLength: successResult[0]?.htmlContent?.length,
      startedAt: successResult[0]?.startedAt,
    });

    return {
      ongoingJob: ongoingResult[0] || null,
      latestSuccessJob: successResult[0] || null,
      isPublishedToday: successResult[0]?.status === "GENERATE_JOB_PUBLISHED",
    };
  } catch (error) {
    console.error("Error checking for today's generation jobs:", error);
    return { ongoingJob: null, latestSuccessJob: null, isPublishedToday: false, error: "Failed to check for today's jobs" };
  }
}
