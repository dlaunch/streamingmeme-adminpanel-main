"use client";

import { useState } from "react";
import type { Article } from "@/lib/db/schema";

// Realtime is disabled - these hooks return static values
// To enable realtime, start local Supabase with `npx supabase start`
// and restore the realtime subscription code

type ArticleChange = {
  type: "INSERT" | "UPDATE" | "DELETE";
  article: Article;
  timestamp: Date;
};

export function useRealtimeArticles(_onArticleChange?: (change: ArticleChange) => void) {
  const [isConnected] = useState(false);
  const [lastUpdate] = useState<Date | null>(null);
  const [recentChanges] = useState<ArticleChange[]>([]);

  // Realtime disabled - no subscription

  return {
    isConnected,
    lastUpdate,
    recentChanges,
  };
}

export function useRealtimeTopNews(_onTopNewsChange?: () => void) {
  const [isConnected] = useState(false);

  // Realtime disabled - no subscription

  return { isConnected };
}

export function useRealtimeAdminHistory(_onHistoryChange?: () => void) {
  const [isConnected] = useState(false);

  // Realtime disabled - no subscription

  return { isConnected };
}
