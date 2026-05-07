"use server";

import { db } from "@/lib/db";
import { sponsors, topNewsItems, adminHistory } from "@/lib/db/schema";
import { eq, desc, asc, and, ilike, or } from "drizzle-orm";
import { getUser } from "./auth";
import { getCurrentTopNewsSponsorId } from "./articles";
import { revalidatePath } from "next/cache";
import { sponsorSchema, updateSponsorSchema } from "@/lib/validations/sponsor";
import type { AdminHistoryStatus } from "@/types/database";

export type SponsorActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export type SponsorFilters = {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export async function getSponsors(filters: SponsorFilters = {}) {
  const {
    search,
    isActive,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = filters;

  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(sponsors.name, `%${search}%`),
          ilike(sponsors.blurb, `%${search}%`),
          ilike(sponsors.headline, `%${search}%`)
        )
      );
    }

    if (isActive !== undefined) {
      conditions.push(eq(sponsors.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      name: sponsors.name,
      created_at: sponsors.createdAt,
      updated_at: sponsors.updatedAt,
    }[sortBy] || sponsors.createdAt;

    const orderFn = sortOrder === "desc" ? desc : asc;

    const sponsorList = await db
      .select()
      .from(sponsors)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    return sponsorList;
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return [];
  }
}

export async function getSponsorById(id: string) {
  try {
    const sponsor = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.id, id))
      .limit(1);

    return sponsor[0] || null;
  } catch (error) {
    console.error("Error fetching sponsor by id:", error);
    return null;
  }
}

export async function getActiveSponsors() {
  try {
    const activeSponsors = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.isActive, true))
      .orderBy(asc(sponsors.name));

    return activeSponsors;
  } catch (error) {
    console.error("Error fetching active sponsors:", error);
    return [];
  }
}

export async function createSponsor(
  prevState: SponsorActionState,
  formData: FormData
): Promise<SponsorActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const underNewsCategoryValue = formData.get("underNewsCategory");
  const rawFormData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
    articleTitle: formData.get("articleTitle") || undefined,
    articleContent: formData.get("articleContent") || undefined,
    articleUrl: formData.get("articleUrl") || undefined,
    isActive: formData.get("isActive") === "true",
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    underNewsCategory: underNewsCategoryValue === "" ? null : underNewsCategoryValue || undefined,
  };

  const validatedFields = sponsorSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0]?.message || "Invalid form data",
    };
  }

  try {
    await db.insert(sponsors).values({
      name: validatedFields.data.name,
      logoUrl: validatedFields.data.logoUrl || null,
      websiteUrl: validatedFields.data.websiteUrl || null,
      headline: validatedFields.data.articleTitle || null,
      blurb: validatedFields.data.articleContent || null,
      ctaUrl: validatedFields.data.articleUrl || null,
      isActive: validatedFields.data.isActive ?? true,
      underNewsCategory: validatedFields.data.underNewsCategory || null,
    });

    revalidatePath("/sponsors");

    return { success: true, message: "Sponsor created successfully" };
  } catch (error) {
    console.error("Error creating sponsor:", error);
    return { error: "Failed to create sponsor" };
  }
}

export async function updateSponsor(
  prevState: SponsorActionState,
  formData: FormData
): Promise<SponsorActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const underNewsCategoryValue = formData.get("underNewsCategory");
  const rawFormData = {
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    logoUrl: formData.get("logoUrl") ?? undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
    articleTitle: formData.get("articleTitle") || undefined,
    articleContent: formData.get("articleContent") || undefined,
    articleUrl: formData.get("articleUrl") || undefined,
    isActive: formData.get("isActive") !== null
      ? formData.get("isActive") === "true"
      : undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    underNewsCategory: underNewsCategoryValue === "" ? null : underNewsCategoryValue || undefined,
  };

  const validatedFields = updateSponsorSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0]?.message || "Invalid form data",
    };
  }

  const { id, ...updateData } = validatedFields.data;

  try {
    const cleanedData: Record<string, unknown> = { updatedAt: new Date() };

    if (updateData.name) cleanedData.name = updateData.name;
    if (updateData.logoUrl !== undefined)
      cleanedData.logoUrl = updateData.logoUrl || null;
    if (updateData.websiteUrl !== undefined)
      cleanedData.websiteUrl = updateData.websiteUrl || null;
    if (updateData.articleTitle !== undefined)
      cleanedData.headline = updateData.articleTitle || null;
    if (updateData.articleContent !== undefined)
      cleanedData.blurb = updateData.articleContent || null;
    if (updateData.articleUrl !== undefined)
      cleanedData.ctaUrl = updateData.articleUrl || null;
    if (updateData.isActive !== undefined)
      cleanedData.isActive = updateData.isActive;
    if (updateData.underNewsCategory !== undefined)
      cleanedData.underNewsCategory = updateData.underNewsCategory || null;

    await db.update(sponsors).set(cleanedData).where(eq(sponsors.id, id));

    // Check if this sponsor is currently the Top News sponsor
    // If so, update the corresponding top_news_items entry as well
    const currentTopSponsorId = await getCurrentTopNewsSponsorId();
    if (currentTopSponsorId === id) {
      // Get the updated sponsor data to ensure we have the latest values
      const updatedSponsor = await getSponsorById(id);
      if (updatedSponsor) {
        await db
          .update(topNewsItems)
          .set({
            title: updatedSponsor.headline || updatedSponsor.name,
            sourceUrl: updatedSponsor.ctaUrl,
            articleThumbnailLink: updatedSponsor.logoUrl,
            summary: updatedSponsor.blurb,
            sourceName: updatedSponsor.name,
            sponsorUrl: updatedSponsor.websiteUrl,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where(eq(topNewsItems.sponsorId, id));
      }
    }

    revalidatePath("/sponsors");
    revalidatePath(`/sponsors/${id}`);
    revalidatePath("/top-news");
    revalidatePath("/dashboard");

    return { success: true, message: "Sponsor updated successfully" };
  } catch (error) {
    console.error("Error updating sponsor:", error);
    return { error: "Failed to update sponsor" };
  }
}

export async function deleteSponsor(
  prevState: SponsorActionState,
  formData: FormData
): Promise<SponsorActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "Invalid sponsor ID" };
  }

  try {
    await db.delete(sponsors).where(eq(sponsors.id, id));

    revalidatePath("/sponsors");

    return { success: true, message: "Sponsor deleted successfully" };
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return { error: "Failed to delete sponsor" };
  }
}

export async function toggleSponsorStatus(
  prevState: SponsorActionState,
  formData: FormData
): Promise<SponsorActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "Invalid sponsor ID" };
  }

  try {
    const sponsor = await getSponsorById(id);
    if (!sponsor) {
      return { error: "Sponsor not found" };
    }

    await db
      .update(sponsors)
      .set({
        isActive: !sponsor.isActive,
        updatedAt: new Date(),
      })
      .where(eq(sponsors.id, id));

    revalidatePath("/sponsors");

    return {
      success: true,
      message: `Sponsor ${sponsor.isActive ? "deactivated" : "activated"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling sponsor status:", error);
    return { error: "Failed to toggle sponsor status" };
  }
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

export async function promoteSponsorToTopNews(
  prevState: SponsorActionState,
  formData: FormData
): Promise<SponsorActionState> {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const sponsorId = formData.get("sponsorId") as string;

  if (!sponsorId) {
    return { error: "Invalid sponsor ID" };
  }

  try {
    // Get the sponsor details
    const sponsor = await getSponsorById(sponsorId);
    if (!sponsor) {
      return { error: "Sponsor not found" };
    }

    // Check if this sponsor is already the current top sponsored news
    const currentTopSponsorId = await getCurrentTopNewsSponsorId();
    if (currentTopSponsorId === sponsorId) {
      return { error: "Sponsor is already the current sponsored top news" };
    }

    // Remove any existing sponsored top news rows before promoting the new one
    await db.delete(topNewsItems).where(eq(topNewsItems.isSponsored, true));

    // Create the top news item with sponsor data
    // id -> sponsor_id
    // headline -> title
    // cta_url -> source_url
    // logo_url -> article_thumbnail_link
    // blurb -> summary
    // name -> source_name
    // website_url -> sponsor_url
    await db.insert(topNewsItems).values({
      title: sponsor.headline || sponsor.name,
      sourceUrl: sponsor.ctaUrl,
      sponsorId: sponsor.id,
      articleThumbnailLink: sponsor.logoUrl,
      summary: sponsor.blurb,
      sourceName: sponsor.name,
      sponsorUrl: sponsor.websiteUrl,
      isSponsored: true,
      createdBy: user.id,
      updatedBy: user.id,
      approvedBy: user.id,
      approvedAt: new Date(),
    });

    await logAdminAction(
      "SPONSOR_PROMOTED_TOPNEWS",
      `Promoted sponsor to top news: ${sponsor.name}`
    );

    revalidatePath("/sponsors");
    revalidatePath("/top-news");
    revalidatePath("/dashboard");

    return { success: true, message: "Sponsor promoted to top news" };
  } catch (error) {
    console.error("Error promoting sponsor to top news:", error);
    return { error: "Failed to promote sponsor" };
  }
}
