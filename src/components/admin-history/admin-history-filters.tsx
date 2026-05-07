"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "All Actions" },
  { value: "GENERAL_ACTION", label: "General Action" },
  { value: "ARTICLE_APPROVED", label: "Article Approved" },
  { value: "ARTICLE_UNAPPROVED", label: "Article Unapproved" },
  { value: "ARTICLE_PROMOTED_TOPNEWS", label: "Article Promoted to Top News" },
  { value: "ARTICLE_DECLINED", label: "Article Declined" },
  { value: "ARTICLE_ARCHIVED", label: "Article Archived" },
  { value: "ARTICLE_EDITED", label: "Article Edited" },
  { value: "SPONSOR_PROMOTED_TOPNEWS", label: "Sponsor Promoted to Top News" },
];

export function AdminHistoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      newSearchParams.delete("page");

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    router.push(`/admin-history?${createQueryString({ [key]: value })}`);
  };

  const handleDateChange = (key: string, date: Date | undefined) => {
    router.push(
      `/admin-history?${createQueryString({
        [key]: date ? format(date, "yyyy-MM-dd") : null,
      })}`
    );
  };

  const clearFilters = () => {
    router.push("/admin-history");
  };

  const hasActiveFilters =
    searchParams.has("status") ||
    searchParams.has("startDate") ||
    searchParams.has("endDate");

  const startDateValue = searchParams.get("startDate");
  const endDateValue = searchParams.get("endDate");

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Action Type" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[180px] justify-start text-left font-normal",
              !startDateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDateValue ? format(new Date(startDateValue), "PPP") : "Start Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDateValue ? new Date(startDateValue) : undefined}
            onSelect={(date) => handleDateChange("startDate", date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[180px] justify-start text-left font-normal",
              !endDateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDateValue ? format(new Date(endDateValue), "PPP") : "End Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDateValue ? new Date(endDateValue) : undefined}
            onSelect={(date) => handleDateChange("endDate", date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
