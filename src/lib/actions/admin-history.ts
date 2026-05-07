"use server";

import { db } from "@/lib/db";
import { adminHistory } from "@/lib/db/schema";
import { eq, desc, asc, and, gte, lte, count } from "drizzle-orm";
import type { AdminHistoryStatus } from "@/types/database";

export type AdminHistoryFilters = {
  status?: AdminHistoryStatus;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export async function getAdminHistory(filters: AdminHistoryFilters = {}) {
  const {
    status,
    createdBy,
    startDate,
    endDate,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 50,
  } = filters;

  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (status) {
      conditions.push(eq(adminHistory.status, status));
    }

    if (createdBy) {
      conditions.push(eq(adminHistory.createdBy, createdBy));
    }

    if (startDate) {
      conditions.push(gte(adminHistory.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(adminHistory.createdAt, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      created_at: adminHistory.createdAt,
      status: adminHistory.status,
    }[sortBy] || adminHistory.createdAt;

    const orderFn = sortOrder === "desc" ? desc : asc;

    const [historyList, totalCountResult] = await Promise.all([
      db.query.adminHistory.findMany({
        where: whereClause,
        with: {
          creator: {
            columns: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
        orderBy: [orderFn(sortColumn)],
        limit,
        offset,
      }),
      db
        .select({ count: count() })
        .from(adminHistory)
        .where(whereClause),
    ]);

    return {
      history: historyList,
      total: totalCountResult[0]?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCountResult[0]?.count || 0) / limit),
    };
  } catch (error) {
    console.error("Error fetching admin history:", error);
    return {
      history: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

export async function getRecentAdminActivity(limit: number = 10) {
  try {
    const recentActivity = await db.query.adminHistory.findMany({
      with: {
        creator: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
      },
      orderBy: [desc(adminHistory.createdAt)],
      limit,
    });

    return recentActivity;
  } catch (error) {
    console.error("Error fetching recent admin activity:", error);
    return [];
  }
}

type ActivityStatItem = { status: string; count: number };

export async function getAdminActivityStats(): Promise<{
  today: ActivityStatItem[];
  thisWeek: ActivityStatItem[];
  thisMonth: ActivityStatItem[];
  allTime: ActivityStatItem[];
}> {
  // TODO: Re-enable once database issues are resolved
  // Temporarily returning empty stats to prevent query failures
  return {
    today: [],
    thisWeek: [],
    thisMonth: [],
    allTime: [],
  };
}
