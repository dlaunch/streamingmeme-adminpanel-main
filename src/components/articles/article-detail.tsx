"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ExternalLink,
  Check,
  X,
  Archive,
  Star,
  Edit,
  Save,
  Brain,
  Calendar,
  Globe,
  Loader2,
  Undo2,
  ChevronDown,
  ComponentIcon,
  GroupIcon,
  DiamondIcon,
  FlagIcon,
} from "lucide-react";
import type { Article } from "@/lib/db/schema";
import { format } from "date-fns";
import { toAppTime } from "@/lib/utils/date";
import { toast } from "sonner";
import { useState } from "react";
import {
  approveArticle,
  declineArticle,
  archiveArticle,
  unapproveArticle,
  promoteToTopNews,
  updateArticle,
} from "@/lib/actions/articles";

interface ArticleDetailProps {
  article: Article;
  currentTopNewsArticleId?: string | null;
  approvedCountForCategory: number;
  maxApprovedPerCategory: number;
}

const classificationBadgeStyle = "bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400";

const statusColors: Record<string, string> = {
  pending_analysis: "border border-input bg-background text-muted-foreground",
  for_categorization: "border border-input bg-background text-muted-foreground",
  for_verification: "border border-input bg-background text-muted-foreground",
  waiting_approval: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved_for_publishing: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  filtered_out: "bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

// Helper function to get display label based on status and classification
const getStatusDisplayLabel = (status: string, classification: string | null): string => {
  if (status === "filtered_out" && classification === "archived") return "Archived";
  if (status === "filtered_out") return "Declined";
  if (status === "approved_for_publishing" && classification === "published") return "Published";
  if (status === "approved_for_publishing") return "Approved";
  if (status === "waiting_approval") return "Waiting approval";
  if (status === "pending_analysis") return "Pending Analysis";
  if (status === "for_categorization") return "For Categorization";
  if (status === "for_verification") return "For Verification";
  return status.replace(/_/g, " ");
};

// Helper function to format event type (e.g., "PRODUCT_LAUNCH" -> "Product launch")
const formatEventType = (eventType: string | null): string => {
  if (!eventType) return "";
  return eventType
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
};

// Helper function to render filtered out reason with reference article link
const renderFilteredOutReason = (reason: string, referenceArticleId: string | null): React.ReactNode => {
  if (!referenceArticleId) return reason;

  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = reason.match(uuidPattern);
  if (!match) return reason;

  const [before, after] = reason.split(match[0]);
  return (
    <>
      {before}
      <a
        href={`/articles/${referenceArticleId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium hover:opacity-80"
      >
        {match[0]}
      </a>
      {after}
    </>
  );
};

// Helper function to parse key takeaways (can be array or string)
const parseKeyTakeaways = (keyTakeaways: string | string[] | null): string[] => {
  if (!keyTakeaways) return [];
  // If already an array, return it
  if (Array.isArray(keyTakeaways)) return keyTakeaways;
  // If it's a string, try parsing as JSON or split by newlines
  if (typeof keyTakeaways === "string") {
    try {
      const parsed = JSON.parse(keyTakeaways);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // If not valid JSON, try splitting by newlines
      return keyTakeaways.split("\n").filter((item) => item.trim());
    }
  }
  return [];
};

export function ArticleDetail({
  article,
  currentTopNewsArticleId,
  approvedCountForCategory,
  maxApprovedPerCategory,
}: ArticleDetailProps) {
  const isApprovalLimitReached = approvedCountForCategory >= maxApprovedPerCategory;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [editedTitle, setEditedTitle] = useState(article.title || "");
  const [editedSummary, setEditedSummary] = useState(article.chatgptSummary || "");
  const [editedNewsletterSummary, setEditedNewsletterSummary] = useState(article.aiGeneratedNewsletterSummary || "");
  const [thumbnailError, setThumbnailError] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [contentExpanded, setContentExpanded] = useState(false);

  const handleApprove = () => {
    const formData = new FormData();
    formData.append("articleId", article.id);

    startTransition(async () => {
      const result = await approveArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article approved");
        router.refresh();
      }
    });
  };

  const handleUnapprove = () => {
    const formData = new FormData();
    formData.append("articleId", article.id);

    startTransition(async () => {
      const result = await unapproveArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article unapproved");
        router.refresh();
      }
    });
  };

  const handleDecline = () => {
    const formData = new FormData();
    formData.append("articleId", article.id);
    if (declineReason) {
      formData.append("reason", declineReason);
    }

    startTransition(async () => {
      const result = await declineArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article declined");
        setDeclineDialogOpen(false);
        setDeclineReason("");
        router.refresh();
      }
    });
  };

  const handleArchive = () => {
    const formData = new FormData();
    formData.append("articleId", article.id);

    startTransition(async () => {
      const result = await archiveArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article archived");
        router.refresh();
      }
    });
  };

  const handlePromoteToTopNews = () => {
    const formData = new FormData();
    formData.append("articleId", article.id);

    startTransition(async () => {
      const result = await promoteToTopNews({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article promoted to top news");
      }
    });
  };

  const handleSaveEdit = () => {
    const formData = new FormData();
    formData.append("articleId", article.id);
    formData.append("title", editedTitle);
    formData.append("summary", editedSummary);
    formData.append("newsletterSummary", editedNewsletterSummary);

    startTransition(async () => {
      const result = await updateArticle({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Article updated");
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Article Details</h2>
            <p className="text-muted-foreground">Preview and manage article</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {article.sourceUrl && (
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Source
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isPending}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel Edit" : "Edit"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {article.originalPublishDate
                        ? format(article.originalPublishDate, "PPP")
                        : "No publish date"}
                    </span>
                    <FlagIcon className="h-3.5 w-3.5 ml-3" />
                    <span>
                      {formatEventType(article.eventType)}
                    </span>               
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                      />
                    </div>
                  ) : article.sourceUrl ? (
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <CardTitle className="text-xl">{article.title}</CardTitle>
                    </a>
                  ) : (
                    <CardTitle className="text-xl">{article.title}</CardTitle>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {article.status && (
                      <Badge className={statusColors[article.status]}>
                        {getStatusDisplayLabel(article.status, article.classification)}
                      </Badge>
                    )}
                    {(article.classification === "archived" || article.classification === "published") && (
                      <Badge
                        variant="outline"
                        className={classificationBadgeStyle}
                      >
                        {article.classification}
                      </Badge>
                    )}
                    {article.articleCategory && (
                      <Badge variant="outline">{article.articleCategory}</Badge>
                    )}
                  </div>
                  {article.filteredOutReason && (
                    <div className="mt-4 p-4 bg-rose-50/80 dark:bg-rose-950/30 rounded-lg">
                      <h4 className="text-sm font-medium text-rose-700 dark:text-rose-400 mb-1">
                        Filtered Out Reason
                      </h4>
                      <p className="text-sm text-rose-600 dark:text-rose-300">
                        {renderFilteredOutReason(article.filteredOutReason, article.referenceArticleId ?? null)}
                      </p>
                    </div>
                  )}
                  {(article.aiGeneratedNewsletterSummary || isEditing) && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedNewsletterSummary}
                          onChange={(e) => setEditedNewsletterSummary(e.target.value)}
                          rows={3}
                          placeholder="Enter newsletter summary..."
                        />
                      ) : (
                        <p className="text-muted-foreground">
                          {article.aiGeneratedNewsletterSummary}
                        </p>
                      )}
                    </div>
                  )}
                  {article.keyTakeaways && parseKeyTakeaways(article.keyTakeaways).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Key Takeaways</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        {parseKeyTakeaways(article.keyTakeaways).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {article.whyItMatters && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Why It Matters</h4>
                      <p className="text-muted-foreground">
                        {article.whyItMatters}
                      </p>
                    </div>
                  )}
                  {article.articleThumbnailLink && !thumbnailError && (
                    <div className="mt-4">
                      <img
                        src={article.articleThumbnailLink}
                        alt={article.title || "Article thumbnail"}
                        className="w-full max-h-80 object-cover rounded-lg"
                        onError={() => setThumbnailError(true)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(article.chatgptSummary || isEditing) && (
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-foreground/80 transition-colors"
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${summaryExpanded ? "" : "-rotate-90"}`}
                    />
                    Executive Summary
                  </button>
                  {summaryExpanded && (
                    isEditing ? (
                      <Textarea
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <p className="text-muted-foreground">{article.chatgptSummary}</p>
                    )
                  )}
                </div>
              )}

              {isEditing && (
                <Button onClick={handleSaveEdit} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}

              {article.rawContentSnippet && (
                <>
                  <Separator />
                  <div>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-foreground/80 transition-colors"
                      onClick={() => setContentExpanded(!contentExpanded)}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${contentExpanded ? "" : "-rotate-90"}`}
                      />
                      Content
                    </button>
                    {contentExpanded && (
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {article.rawContentSnippet}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

            </CardContent>
          </Card>

          {/* AI Analysis */}
          {(article.aiAnalyzerTotalScore !== null || article.categoryTags) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {article.aiAnalyzerTotalScore !== null && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">AI Score</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            article.aiAnalyzerTotalScore >= 70
                              ? "bg-emerald-500/80 dark:bg-emerald-600/70"
                              : article.aiAnalyzerTotalScore >= 40
                                ? "bg-amber-500/80 dark:bg-amber-600/70"
                                : "bg-rose-500/80 dark:bg-rose-600/70"
                          }`}
                          style={{ width: `${article.aiAnalyzerTotalScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {article.aiAnalyzerTotalScore}
                      </span>
                    </div>
                  </div>
                )}

                {article.categoryTags && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Category Tags</h4>
                    <p className="text-muted-foreground">{article.categoryTags}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions - only show for actionable statuses */}
          {(article.status === "waiting_approval" || article.status === "approved_for_publishing") && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-1">
                  {article.articleCategory ? (
                    <>
                      <Badge variant="outline" className="w-fit">{article.articleCategory}</Badge>
                      {isApprovalLimitReached ? (
                        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                          Slots full!
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground mb-3">
                          {approvedCountForCategory}/{maxApprovedPerCategory} slots used for today's newsletter
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      This article currently has no category
                    </span>
                  )}
                </div>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Manage this article</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {article.status === "waiting_approval" && (
                  <Button
                    className="w-full bg-emerald-600/90 hover:bg-emerald-600 dark:bg-emerald-700/80 dark:hover:bg-emerald-700 text-white"
                    onClick={handleApprove}
                    disabled={isPending || isApprovalLimitReached || !article.articleCategory}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                )}

                {article.status === "approved_for_publishing" && (
                  <Button
                    className="w-full bg-amber-600/90 hover:bg-amber-600 dark:bg-amber-700/80 dark:hover:bg-amber-700 text-white"
                    onClick={handleUnapprove}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Undo2 className="h-4 w-4 mr-2" />
                    )}
                    Unapprove
                  </Button>
                )}

                {article.status === "waiting_approval" && (
                <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </DialogTrigger>
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
                          onClick={() => setDeclineDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDecline}
                          disabled={isPending}
                        >
                          Decline Article
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {article.status === "waiting_approval" && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleArchive}
                    disabled={isPending || article.classification === "archived"}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {article.classification === "archived" ? "Archived" : "Archive"}
                  </Button>
                )}

                {article.status === "approved_for_publishing" && article.classification !== "archived" && (
                  <>
                    <Separator className="my-4" />
                    {currentTopNewsArticleId === article.id ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <Star className="h-4 w-4 mr-2 text-amber-500 fill-amber-500" />
                        Today&apos;s Top News
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handlePromoteToTopNews}
                        disabled={isPending}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Promote to Top News
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {article.sourceName && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Source</p>
                    {article.sourceUrl ? (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {article.sourceName}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {article.sourceName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {article.originalPublishDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Original Publish Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(article.originalPublishDate, "PPP")}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium">Aggregated</p>
                <p className="text-sm text-muted-foreground">
                  {format(toAppTime(article.aggregatedAt), "PPP p")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Image Preview */}
          {article.articleThumbnailLink && (
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={article.articleThumbnailLink}
                  alt={article.title || "Article thumbnail"}
                  className="rounded-lg w-full object-cover"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
