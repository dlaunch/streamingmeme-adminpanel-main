"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AdminHistoryStatus } from "@/types/database";

interface Activity {
  id: number;
  status: AdminHistoryStatus | null;
  actionDescription: string | null;
  createdAt: Date;
  createdBy: string | null;
  creator: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
  } | null;
}

interface RecentActivityProps {
  activities: Activity[];
}

const statusConfig: Record<
  AdminHistoryStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string; icon?: React.ReactNode }
> = {
  GENERAL_ACTION: { label: "General Action", variant: "outline" },
  ARTICLE_APPROVED: { label: "Approved", variant: "secondary", className: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ARTICLE_UNAPPROVED: { label: "Unapproved", variant: "secondary", className: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  ARTICLE_PROMOTED_TOPNEWS: { label: "Article Promoted", variant: "secondary", className: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <Star className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" /> },
  ARTICLE_DECLINED: { label: "Declined", variant: "secondary", className: "bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  ARTICLE_ARCHIVED: { label: "Archived", variant: "secondary" },
  ARTICLE_EDITED: { label: "Edited", variant: "outline" },
  SPONSOR_PROMOTED_TOPNEWS: { label: "Sponsor Promoted", variant: "secondary", className: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <Star className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" /> },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const config = activity.status ? statusConfig[activity.status] : null;
                const fallbackConfig = { label: activity.status || "Unknown", variant: "outline" as const };
                const creatorName = activity.creator?.displayName ||
                  [activity.creator?.firstName, activity.creator?.lastName].filter(Boolean).join(" ") ||
                  activity.creator?.email ||
                  "Unknown";

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={config?.variant ?? fallbackConfig.variant}
                          className={`text-xs ${config?.className || ""}`}
                        >
                          {config?.icon}
                          {config?.label ?? fallbackConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {activity.actionDescription && (
                        <p className="text-sm font-medium truncate">
                          {activity.actionDescription}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        by {creatorName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
