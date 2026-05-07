"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSponsor, type SponsorActionState } from "@/lib/actions/sponsors";
import type { Sponsor } from "@/lib/db/schema";
import { format } from "date-fns";
import { toAppTime } from "@/lib/utils/date";
import { newsCategoryValues } from "@/lib/validations/sponsor";
import { Switch } from "@/components/ui/switch";

const categoryLabels: Record<string, string> = {
  ENCODING_AND_SOFTWARE: "Encoding & Software",
  VIDEO_DELIVERY_AND_CDN: "Video Delivery & CDN",
  VIDEO_STREAMING_AND_DELIVERY_PLATFORMS: "Streaming & Delivery Platforms",
  ARTIFICIAL_INTELLIGENCE_FOR_VIDEO_APPLICATIONS: "AI for Video",
  PRODUCTION_HARDWARE: "Production Hardware",
  BUSINESS_NEWS: "Business News",
  MONETIZATION_AND_AD_TECH: "Monetization & Ad Tech",
  REGULATORY_AND_POLICY: "Regulatory & Policy",
};

interface EditSponsorDialogProps {
  sponsor: Sponsor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState: SponsorActionState = {};

export function EditSponsorDialog({
  sponsor,
  open,
  onOpenChange,
}: EditSponsorDialogProps) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(sponsor.underNewsCategory || "");
  const [isActive, setIsActive] = useState<boolean>(sponsor.isActive);
  const [state, formAction, isPending] = useActionState(updateSponsor, initialState);

  useEffect(() => {
    setCategory(sponsor.underNewsCategory || "");
    setIsActive(sponsor.isActive);
  }, [sponsor]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onOpenChange(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sponsor</DialogTitle>
          <DialogDescription>
            Update sponsor information
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={sponsor.id} />

          <div className="space-y-2">
            <Label htmlFor="name">Sponsor Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Company Name"
              defaultValue={sponsor.name}
              required
              disabled={isPending}
            />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of the sponsor"
              defaultValue={sponsor.description || ""}
              rows={3}
              disabled={isPending}
            />
          </div>           */}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                placeholder="https://..."
                defaultValue={sponsor.logoUrl || ""}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL *</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://..."
                defaultValue={sponsor.websiteUrl || ""}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Sponsored Article</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="articleTitle">Article Title *</Label>
                <Input
                  id="articleTitle"
                  name="articleTitle"
                  placeholder="Sponsored article title"
                  defaultValue={sponsor.headline || ""}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="articleContent">Article Content *</Label>
                <Textarea
                  id="articleContent"
                  name="articleContent"
                  placeholder="Sponsored article content"
                  defaultValue={sponsor.blurb || ""}
                  rows={4}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="articleUrl">Article URL *</Label>
                <Input
                  id="articleUrl"
                  name="articleUrl"
                  type="url"
                  placeholder="https://..."
                  defaultValue={sponsor.ctaUrl || ""}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="underNewsCategory">Category *</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isPending}
                >
                  <SelectTrigger id="underNewsCategory">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {newsCategoryValues.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="underNewsCategory" value={category} />
              </div>
            </div>
          </div>

          {/* <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Schedule</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={
                    sponsor.startDate
                      ? format(toAppTime(sponsor.startDate), "yyyy-MM-dd")
                      : ""
                  }
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={
                    sponsor.endDate
                      ? format(toAppTime(sponsor.endDate), "yyyy-MM-dd")
                      : ""
                  }
                  disabled={isPending}
                />
              </div>
            </div>
          </div> */}

          <div className="flex items-center justify-between border-t pt-4">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
              className="data-[state=checked]:bg-green-500"
            />
            <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !category}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
