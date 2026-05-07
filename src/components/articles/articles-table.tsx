"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Check,
  X,
  Archive,
  Star,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import type { Article } from "@/lib/db/schema";
import { formatDistanceToNow, format } from "date-fns";
import {
  approveArticle,
  declineArticle,
  archiveArticle,
  unapproveArticle,
  bulkAction,
  promoteToTopNews,
} from "@/lib/actions/articles";

interface ArticlesTableProps {
  articles: Article[];
  totalPages: number;
  currentPage: number;
  total: number;
  statusFilter?: string;
  classificationFilter?: string;
  currentTopNewsArticleId?: string | null;
  categoryApprovalCounts: Record<string, number>;
  maxApprovedPerCategory: number;
}

const classificationBadgeStyle = "bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400";

// Helper function to get display badge based on status and classification
const getStatusDisplay = (status: string, classification: string | null) => {
  // Archived: status is filtered_out AND classification is archived
  if (status === "filtered_out" && classification === "archived") {
    return { label: "Archived", color: "bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400" };
  }
  // Declined: status is filtered_out (and not archived)
  if (status === "filtered_out") {
    return { label: "Declined", color: "bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" };
  }
  // Published: status is approved_for_publishing AND classification is published
  if (status === "approved_for_publishing" && classification === "published") {
    return { label: "Published", color: "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  }
  // Approved: status is approved_for_publishing
  if (status === "approved_for_publishing") {
    return { label: "Approved", color: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
  }
  // Waiting approval: status is waiting_approval
  if (status === "waiting_approval") {
    return { label: "Waiting approval", color: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  }
  // Pipeline statuses (pending_analysis, for_categorization, for_verification) - use outline style
  const statusLabels: Record<string, string> = {
    pending_analysis: "Pending Analysis",
    for_categorization: "For Categorization",
    for_verification: "For Verification",
  };
  return {
    label: statusLabels[status] || status.replace(/_/g, " "),
    color: "border border-input bg-background text-muted-foreground"
  };
};

const getAiScoreColor = (score: number): string => {
  if (score === 0) {
    return "text-slate-600 dark:text-slate-400";
  }
  if (score >= 1 && score <= 49) {
    return "text-rose-600 dark:text-rose-400";
  }
  if (score >= 50 && score <= 74) {
    return "text-amber-600 dark:text-amber-400";
  }
  // 75 and above
  return "text-emerald-600 dark:text-emerald-400";
};

export function ArticlesTable({
  articles,
  totalPages,
  currentPage,
  total,
  statusFilter,
  classificationFilter,
  currentTopNewsArticleId,
  categoryApprovalCounts,
  maxApprovedPerCategory,
}: ArticlesTableProps) {
  // Helper to get approval status text for a category
  const getApprovalStatusText = (category: string | null) => {
    const cat = category || "uncategorized";
    const count = categoryApprovalCounts[cat] || 0;
    if (count >= maxApprovedPerCategory) {
      return "Slots full!";
    }
    return `${count}/${maxApprovedPerCategory}`;
  };

  const isApprovalLimitReached = (category: string | null) => {
    const cat = category || "uncategorized";
    const count = categoryApprovalCounts[cat] || 0;
    return count >= maxApprovedPerCategory;
  };
  const router = useRouter();
  const showBulkActions = statusFilter === "waiting_approval" || statusFilter === "approved_for_publishing";
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [articleToDecline, setArticleToDecline] = useState<string | null>(null);
  const [bulkDeclineOpen, setBulkDeclineOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const VISITED_KEY = "just_visited_articles";
  const [justVisitedIds, setJustVisitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(VISITED_KEY);
      if (stored) setJustVisitedIds(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  function handleArticleClick(id: string) {
    setJustVisitedIds((prev) => {
      const next = new Set(prev).add(id);
      try {
        sessionStorage.setItem(VISITED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const [optimisticArticles, updateOptimisticArticles] = useOptimistic(
    articles,
    (state, { id, action }: { id: string; action: string }) => {
      return state.map((article) => {
        if (article.id === id) {
          switch (action) {
            case "approve":
              return {
                ...article,
                status: "approved_for_publishing" as const,
                classification: "active" as const,
              };
            case "decline":
              return {
                ...article,
                status: "filtered_out" as const,
                classification: "active" as const,
              };
            case "archive":
              return {
                ...article,
                classification: "archived" as const,
              };
            case "unapprove":
              return {
                ...article,
                status: "waiting_approval" as const,
              };
            default:
              return article;
          }
        }
        return article;
      });
    }
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === articles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(articles.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApprove = async (articleId: string) => {
    const formData = new FormData();
    formData.append("articleId", articleId);

    startTransition(async () => {
      updateOptimisticArticles({ id: articleId, action: "approve" });
      const result = await approveArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article approved");
        router.refresh();
      }
    });
  };

  const handleDecline = async () => {
    if (!articleToDecline) return;

    const formData = new FormData();
    formData.append("articleId", articleToDecline);
    if (declineReason) {
      formData.append("reason", declineReason);
    }

    startTransition(async () => {
      updateOptimisticArticles({ id: articleToDecline, action: "decline" });
      const result = await declineArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article declined");
        router.refresh();
      }
    });

    setDeclineDialogOpen(false);
    setDeclineReason("");
    setArticleToDecline(null);
  };

  const handleArchive = async (articleId: string) => {
    const formData = new FormData();
    formData.append("articleId", articleId);

    startTransition(async () => {
      updateOptimisticArticles({ id: articleId, action: "archive" });
      const result = await archiveArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article archived");
        router.refresh();
      }
    });
  };

  const handleUnapprove = async (articleId: string) => {
    const formData = new FormData();
    formData.append("articleId", articleId);

    startTransition(async () => {
      updateOptimisticArticles({ id: articleId, action: "unapprove" });
      const result = await unapproveArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article unapproved");
        router.refresh();
      }
    });
  };

  const handlePromoteToTopNews = async (articleId: string) => {
    const formData = new FormData();
    formData.append("articleId", articleId);

    startTransition(async () => {
      const result = await promoteToTopNews({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article promoted to top news");
      }
    });
  };

  const handleBulkAction = async (action: "approve" | "decline" | "archive" | "unapprove") => {
    if (selectedIds.length === 0) {
      toast.error("No articles selected");
      return;
    }

    if (action === "decline") {
      setBulkDeclineOpen(true);
      return;
    }

    let idsToProcess = selectedIds;

    // For approve action, filter out articles without a category
    if (action === "approve") {
      const articlesWithCategory = optimisticArticles.filter(
        (article) => selectedIds.includes(article.id) && article.articleCategory
      );
      const articlesWithoutCategory = selectedIds.length - articlesWithCategory.length;

      if (articlesWithoutCategory > 0) {
        toast.error(`${articlesWithoutCategory} article(s) skipped: no category assigned`);
      }

      if (articlesWithCategory.length === 0) {
        return;
      }

      idsToProcess = articlesWithCategory.map((article) => article.id);
    }

    const formData = new FormData();
    formData.append("articleIds", JSON.stringify(idsToProcess));
    formData.append("action", action);

    startTransition(async () => {
      const result = await bulkAction({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleBulkDecline = async () => {
    const formData = new FormData();
    formData.append("articleIds", JSON.stringify(selectedIds));
    formData.append("action", "decline");
    if (declineReason) {
      formData.append("reason", declineReason);
    }

    startTransition(async () => {
      const result = await bulkAction({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setSelectedIds([]);
        router.refresh();
      }
    });

    setBulkDeclineOpen(false);
    setDeclineReason("");
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/articles?${params.toString()}`);
  };

  // Group articles by category
  const groupedArticles = optimisticArticles.reduce(
    (acc, article) => {
      const category = article.articleCategory || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(article);
      return acc;
    },
    {} as Record<string, Article[]>
  );

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar - shown when status filter is waiting_approval or approved_for_publishing */}
      {showBulkActions && selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2">
            {statusFilter === "waiting_approval" && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600/90 hover:bg-emerald-600 dark:bg-emerald-700/80 dark:hover:bg-emerald-700 text-white"
                  onClick={() => handleBulkAction("approve")}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction("decline")}
                  disabled={isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline All
                </Button>
                {classificationFilter !== "archived" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleBulkAction("archive")}
                    disabled={isPending}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive All
                  </Button>
                )}
              </>
            )}
            {statusFilter === "approved_for_publishing" && (
              <Button
                size="sm"
                className="bg-amber-600/90 hover:bg-amber-600 dark:bg-amber-700/80 dark:hover:bg-amber-700 text-white"
                onClick={() => handleBulkAction("unapprove")}
                disabled={isPending}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Unapprove All
              </Button>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds([])}
            disabled={isPending}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Articles Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showBulkActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === articles.length && articles.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-[30%]">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {optimisticArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showBulkActions ? 8 : 7} className="text-center py-8">
                  <p className="text-muted-foreground">No articles found</p>
                </TableCell>
              </TableRow>
            ) : (
              optimisticArticles.map((article) => (
                <TableRow key={article.id}>
                  {showBulkActions && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(article.id)}
                        onCheckedChange={() => toggleSelect(article.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="max-w-[500px]">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/articles/${article.id}`}
                          className={`font-medium hover:underline line-clamp-1 ${article.markedReadBy || justVisitedIds.has(article.id) ? "text-muted-foreground" : ""}`}
                          onClick={() => handleArticleClick(article.id)}
                        >
                          {article.title}
                        </Link>
                        {currentTopNewsArticleId === article.id && (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      {article.chatgptSummary && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {article.chatgptSummary}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.articleCategory && (
                      <Badge variant="outline">{article.articleCategory}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {article.sourceName || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {article.aiAnalyzerTotalScore !== null ? (
                      <span className={`text-lg font-medium ${getAiScoreColor(article.aiAnalyzerTotalScore)}`}>
                        {article.aiAnalyzerTotalScore}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {article.status && (() => {
                        const display = getStatusDisplay(article.status, article.classification);
                        const badge = (
                          <Badge className={display.color}>
                            {display.label}
                          </Badge>
                        );
                        if (display.label === "Declined" && article.filteredOutReason) {
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {badge}
                              </TooltipTrigger>
                              <TooltipContent>
                                {article.filteredOutReason.length > 160 ? article.filteredOutReason.slice(0, 160) + "…" : article.filteredOutReason}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return badge;
                      })()}
                      {(article.classification === "archived" || article.classification === "published") && (
                        <Badge
                          variant="outline"
                          className={classificationBadgeStyle}
                        >
                          {article.classification}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(article.aggregatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        {article.sourceUrl && (
                          <DropdownMenuItem asChild>
                            <a
                              href={article.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Source
                            </a>
                          </DropdownMenuItem>
                        )}
                        {(article.status === "waiting_approval" || article.status === "approved_for_publishing") && (
                          <>
                            <DropdownMenuSeparator />
                            {article.status === "waiting_approval" && (
                              <DropdownMenuItem
                                onClick={() => handleApprove(article.id)}
                                disabled={isApprovalLimitReached(article.articleCategory) || !article.articleCategory}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                <span className="flex-1">Approve</span>
                                <span
                                  className={`ml-2 text-xs ${
                                    isApprovalLimitReached(article.articleCategory)
                                      ? "text-rose-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {getApprovalStatusText(article.articleCategory)}
                                </span>
                              </DropdownMenuItem>
                            )}
                            {article.status === "waiting_approval" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setArticleToDecline(article.id);
                                  setDeclineDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Decline
                              </DropdownMenuItem>
                            )}
                            {article.status === "waiting_approval" && article.classification !== "archived" && (
                              <DropdownMenuItem
                                onClick={() => handleArchive(article.id)}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            {article.status === "approved_for_publishing" && (
                              <DropdownMenuItem
                                onClick={() => handleUnapprove(article.id)}
                              >
                                <Undo2 className="h-4 w-4 mr-2" />
                                Unapprove
                              </DropdownMenuItem>
                            )}
                            {article.status === "approved_for_publishing" && article.classification !== "archived" && (
                              <>
                                <DropdownMenuSeparator />
                                {currentTopNewsArticleId === article.id ? (
                                  <DropdownMenuItem disabled>
                                    <Star className="h-4 w-4 mr-2 text-amber-500 fill-amber-500" />
                                    Today&apos;s Top News
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handlePromoteToTopNews(article.id)}
                                  >
                                    <Star className="h-4 w-4 mr-2" />
                                    Promote to Top News
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * 50 + 1} to{" "}
          {Math.min(currentPage * 50, total)} of {total} articles
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

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Article</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for declining this article.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeclineDialogOpen(false);
                setDeclineReason("");
                setArticleToDecline(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline}>
              Decline Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Decline Dialog */}
      <Dialog open={bulkDeclineOpen} onOpenChange={setBulkDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline {selectedIds.length} Articles</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for declining these articles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkReason">Reason (optional)</Label>
              <Textarea
                id="bulkReason"
                placeholder="Enter reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkDeclineOpen(false);
                setDeclineReason("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDecline}>
              Decline {selectedIds.length} Articles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
