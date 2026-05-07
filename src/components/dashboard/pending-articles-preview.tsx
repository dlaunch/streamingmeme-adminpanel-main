"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { Article } from "@/lib/db/schema";
import { formatDistanceToNow } from "date-fns";

interface PendingArticlesPreviewProps {
  articles: Article[];
  totalPending: number;
}

export function PendingArticlesPreview({
  articles,
  totalPending,
}: PendingArticlesPreviewProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Waiting Approval</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalPending} articles awaiting approval
          </p>
        </div>
        <Link href="/articles?status=waiting_approval">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No articles waiting approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {article.articleCategory && (
                      <Badge variant="outline" className="text-xs">
                        {article.articleCategory}
                      </Badge>
                    )}
                    {article.aiAnalyzerTotalScore != null && (
                      <Badge
                        variant={article.aiAnalyzerTotalScore >= 70 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        AI: {article.aiAnalyzerTotalScore}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-sm line-clamp-1">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {article.sourceName || "Unknown source"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {article.aggregatedAt &&
                        formatDistanceToNow(new Date(article.aggregatedAt), {
                          addSuffix: true,
                        })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {article.sourceUrl && (
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Link href={`/articles/${article.id}`}>
                    <Button variant="ghost" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
