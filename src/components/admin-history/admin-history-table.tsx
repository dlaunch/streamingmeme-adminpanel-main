"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Star, Megaphone } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toAppTime } from "@/lib/utils/date";
import type { AdminHistoryStatus } from "@/types/database";

interface HistoryRecord {
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

interface AdminHistoryTableProps {
  history: HistoryRecord[];
  totalPages: number;
  currentPage: number;
  total: number;
}

const ARTICLE_STATUSES: AdminHistoryStatus[] = [
  "ARTICLE_APPROVED",
  "ARTICLE_UNAPPROVED",
  "ARTICLE_PROMOTED_TOPNEWS",
  "ARTICLE_DECLINED",
  "ARTICLE_ARCHIVED",
  "ARTICLE_EDITED",
];

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function renderActionDescription(description: string, status: AdminHistoryStatus | null) {
  if (!status || !ARTICLE_STATUSES.includes(status)) return description;

  const match = description.match(UUID_PATTERN);
  if (!match) return description;

  const uuid = match[0];
  const [before, after] = description.split(uuid);
  return (
    <>
      {before}
      <a
        href={`/articles/${uuid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium hover:opacity-80"
      >
        {uuid}
      </a>
      {after}
    </>
  );
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

export function AdminHistoryTable({
  history,
  totalPages,
  currentPage,
  total,
}: AdminHistoryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin-history?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Action</TableHead>
              <TableHead className="w-[60%]">Description</TableHead>
              <TableHead className="w-[15%]">Performed By</TableHead>
              <TableHead className="w-[10%]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground">No history records found</p>
                </TableCell>
              </TableRow>
            ) : (
              history.map((record) => {
                const config = record.status ? statusConfig[record.status] : null;
                const fallbackConfig = { label: record.status || "Unknown", variant: "outline" as const };
                const creatorName = record.creator?.displayName ||
                  [record.creator?.firstName, record.creator?.lastName].filter(Boolean).join(" ") ||
                  record.creator?.email ||
                  "Unknown";

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge
                        variant={config?.variant ?? fallbackConfig.variant}
                        className={config?.className}
                      >
                        {config?.icon}
                        {config?.label ?? fallbackConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.actionDescription ? (
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {renderActionDescription(record.actionDescription, record.status)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{creatorName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {format(toAppTime(record.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(record.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * 50 + 1} to{" "}
          {Math.min(currentPage * 50, total)} of {total} records
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
