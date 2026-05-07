import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, newsletterGenerationJobs } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let jobId: string | null = null;
  try {
    const body = await request.json();
    jobId = body.jobId || null;
  } catch {
    // No body or invalid JSON — jobId remains null
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db
      .update(articles)
      .set({ classification: "published" })
      .where(
        and(
          eq(articles.status, "approved_for_publishing"),
          eq(articles.classification, "active"),
          sql`${articles.approvedAt} >= ${today.toISOString()}`,
          sql`${articles.approvedAt} < ${tomorrow.toISOString()}`
        )
      )
      .returning({ id: articles.id });

    if (jobId) {
      await db
        .update(newsletterGenerationJobs)
        .set({ status: "GENERATE_JOB_PUBLISHED" })
        .where(eq(newsletterGenerationJobs.id, jobId));
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      message: `${result.length} article(s) marked as published`,
    });
  } catch (error) {
    console.error("Error finalizing articles:", error);
    return NextResponse.json(
      { error: "Failed to finalize articles" },
      { status: 500 }
    );
  }
}
