"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface CategoryCountsBarProps {
  categoryApprovalCounts: Record<string, number>;
  maxPerCategory: number;
  categories: string[];
}

export function CategoryCountsBar({
  categoryApprovalCounts,
  maxPerCategory,
  categories,
}: CategoryCountsBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const sortedCategories = [...categories].sort();

  return (
    <div className="sticky top-16 z-20 bg-background">
      <div className="flex items-center px-6 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          Approvals Today
        </Button>
      </div>
      {isExpanded && (
        <div className="flex flex-wrap gap-2 px-6 pb-3">
          {sortedCategories.map((category) => {
            const count = categoryApprovalCounts[category] ?? 0;
            const isFull = count >= maxPerCategory;
            const isExceeded = count > maxPerCategory;

            const link = (
              <Link
                key={category}
                href={`/articles?category=${encodeURIComponent(category)}&status=approved_for_publishing&approvedToday=true`}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent ${
                  isExceeded
                    ? "border-amber-600/40 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-400"
                    : isFull
                      ? "border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "border-input bg-card text-card-foreground"
                }`}
              >
                <span className="font-medium">{category}</span>
                <span
                  className={`text-xs tabular-nums ${
                    isExceeded
                      ? "text-amber-600 dark:text-amber-400"
                      : isFull
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {count}/{maxPerCategory}
                </span>
              </Link>
            );

            if (isExceeded) {
              return (
                <Tooltip key={category}>
                  <TooltipTrigger asChild>
                    {link}
                  </TooltipTrigger>
                  <TooltipContent>
                    You have exceeded the limit for this category. Unapprove {count - maxPerCategory} {count - maxPerCategory === 1 ? "article" : "articles"} to stay within the limit.
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </div>
      )}
    </div>
  );
}
