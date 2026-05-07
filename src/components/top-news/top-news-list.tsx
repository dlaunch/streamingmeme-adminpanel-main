"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Eye,
  Star,
  Megaphone,
  Globe,
  Calendar,
  Pencil,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { Article, TopNewsItem, UserProfile, Sponsor } from "@/lib/db/schema";
import { EditSponsorDialog } from "@/components/sponsors/edit-sponsor-dialog";

interface TopNewsItemWithRelations extends TopNewsItem {
  article?: Article | null;
  sponsor?: Sponsor | null;
  creator: UserProfile | null;
}

interface TopNewsListProps {
  nonSponsoredItem: TopNewsItemWithRelations | null;
  sponsoredItem: TopNewsItemWithRelations | null;
}

export function TopNewsList({ nonSponsoredItem, sponsoredItem }: TopNewsListProps) {
  const [editSponsorOpen, setEditSponsorOpen] = useState(false);
  const hasItems = nonSponsoredItem || sponsoredItem;

  if (!hasItems) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Top News Items for Today</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Promote approved articles and sponsors to feature them in today&apos;s newsletter.
          </p>
          <div className="flex gap-2 mt-4">
            <Link href="/articles?status=approved_for_publishing">
              <Button>Browse Approved Articles</Button>
            </Link>
            <Link href="/sponsors">
              <Button variant="outline">Browse Sponsors</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Here&apos;s what our readers will see first:
        </p>
        <div className="flex gap-2">
          <Link href="/articles?status=approved_for_publishing">
            <Button variant="outline" size="sm">Select Article</Button>
          </Link>
          <Link href="/sponsors">
            <Button variant="outline" size="sm">Select Sponsor</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Non-Sponsored Top News */}
        <Card className={nonSponsoredItem ? "hover:bg-muted/50 transition-colors h-full" : "border-dashed h-full"}>
          <CardContent className="py-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">Featured Article</span>
              </div>
              {nonSponsoredItem?.article?.articleCategory && (
                <Badge variant="outline" className="text-xs">
                  {nonSponsoredItem.article.articleCategory}
                </Badge>
              )}
            </div>

            {nonSponsoredItem ? (
              <div className="flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {nonSponsoredItem.sourceName || "Unknown source"}
                    </span>
                    {nonSponsoredItem.article?.originalPublishDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(nonSponsoredItem.article.originalPublishDate, "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium line-clamp-2">
                    {nonSponsoredItem.sourceUrl ? (
                      <a
                        href={nonSponsoredItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {nonSponsoredItem.title}
                      </a>
                    ) : (
                      nonSponsoredItem.title
                    )}
                  </h3>
                  {nonSponsoredItem.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {nonSponsoredItem.summary}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Promoted{" "}
                    {formatDistanceToNow(new Date(nonSponsoredItem.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    {nonSponsoredItem.sourceUrl && (
                      <a
                        href={nonSponsoredItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {nonSponsoredItem.articleId && (
                      <Link href={`/articles/${nonSponsoredItem.articleId}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No featured article for today
                </p>
                <Link href="/articles?status=approved_for_publishing">
                  <Button variant="outline" size="sm">Select Article</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sponsored Top News */}
        <Card className={sponsoredItem ? "hover:bg-muted/50 transition-colors h-full" : "border-dashed h-full"}>
          <CardContent className="py-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">Sponsored Content</span>
              </div>
              {sponsoredItem?.sponsor?.underNewsCategory && (
                <Badge variant="outline" className="text-xs">
                  {sponsoredItem.sponsor.underNewsCategory}
                </Badge>
              )}
            </div>

            {sponsoredItem ? (
              <div className="flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Megaphone className="h-3 w-3" />
                    {sponsoredItem.sponsorUrl ? (
                      <a
                        href={sponsoredItem.sponsorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {sponsoredItem.sourceName || "Unknown sponsor"}
                      </a>
                    ) : (
                      sponsoredItem.sourceName || "Unknown sponsor"
                    )}
                  </div>
                  <h3 className="font-medium line-clamp-2">
                    {sponsoredItem.sourceUrl ? (
                      <a
                        href={sponsoredItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {sponsoredItem.title}
                      </a>
                    ) : (
                      sponsoredItem.title
                    )}
                  </h3>
                  {sponsoredItem.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {sponsoredItem.summary}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Promoted{" "}
                    {formatDistanceToNow(new Date(sponsoredItem.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    {sponsoredItem.sponsor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditSponsorOpen(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {sponsoredItem.sponsorUrl && (
                      <a
                        href={sponsoredItem.sponsorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {sponsoredItem.sourceUrl && (
                      <a
                        href={sponsoredItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No sponsored content for today
                </p>
                <Link href="/sponsors">
                  <Button variant="outline" size="sm">Select Sponsor</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Sponsor Dialog */}
      {sponsoredItem?.sponsor && (
        <EditSponsorDialog
          sponsor={sponsoredItem.sponsor}
          open={editSponsorOpen}
          onOpenChange={setEditSponsorOpen}
        />
      )}
    </div>
  );
}
