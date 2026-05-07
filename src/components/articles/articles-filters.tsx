"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

interface ArticlesFiltersProps {
  categories: string[];
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending_analysis", label: "Pending Analysis" },
  { value: "for_categorization", label: "For Categorization" },
  { value: "for_verification", label: "For Verification" },
  { value: "waiting_approval", label: "Waiting Approval" },
  { value: "approved_for_publishing", label: "Approved" },
  { value: "filtered_out", label: "Declined" },
];

const classificationOptions = [
  { value: "all", label: "All Classifications" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "published", label: "Published" },
];

const sortOptions = [
  { value: "article_category", label: "Category" },
  { value: "created_at", label: "Created Date" },
  { value: "original_publish_date", label: "Publish Date" },
  { value: "ai_score", label: "AI Score" },
  { value: "title", label: "Title" },
];

export function ArticlesFilters({ categories }: ArticlesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Sync search value with URL params on back/forward navigation
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });

      // Reset to page 1 when filters change
      if (!params.page) {
        newSearchParams.delete("page");
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/articles?${createQueryString({ search: searchValue })}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    router.push(`/articles?${createQueryString({ [key]: value })}`);
  };

  const handleStatusFilterChange = (value: string) => {
    const currentCategory = searchParams.get("category");
    const currentStatus = searchParams.get("status");
    const currentApprovedToday = searchParams.get("approvedToday");

    const shouldClearApprovedToday =
      value !== "approved_for_publishing" &&
      currentStatus === "approved_for_publishing" &&
      currentApprovedToday === "true" &&
      currentCategory !== null &&
      currentCategory !== "";

    const params: Record<string, string | null> = { status: value };
    if (shouldClearApprovedToday) {
      params.approvedToday = null;
    }

    router.push(`/articles?${createQueryString(params)}`);
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/articles");
  };

  const hasActiveFilters =
    searchParams.has("search") ||
    searchParams.has("category") ||
    searchParams.has("status") ||
    searchParams.has("classification") ||
    searchParams.has("approvedToday");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex items-center gap-2">
        <Select
          value={searchParams.get("status") || "all"}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("category") || "all"}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger className="w-[320px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
              <SheetDescription>
                Filter and sort articles by various criteria
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select
                  value={searchParams.get("classification") || "all"}
                  onValueChange={(value) => handleFilterChange("classification", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classificationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={searchParams.get("sortBy") || "article_category"}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select
                  value={searchParams.get("sortOrder") || "asc"}
                  onValueChange={(value) => handleFilterChange("sortOrder", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
