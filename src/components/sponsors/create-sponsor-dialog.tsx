"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { newsCategoryValues } from "@/lib/validations/sponsor";
import { toast } from "sonner";
import { createSponsor, type SponsorActionState } from "@/lib/actions/sponsors";
import { useEffect } from "react";

const initialState: SponsorActionState = {};

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

export function CreateSponsorDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [state, formAction, isPending] = useActionState(createSponsor, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Sponsor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Sponsor</DialogTitle>
          <DialogDescription>
            Create a new sponsor for your newsletter
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sponsor Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Company Name"
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
              rows={3}
              disabled={isPending}
            />
          </div> */}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                placeholder="https://..."
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
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Sponsored Article *</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="articleTitle">Article Title *</Label>
                <Input
                  id="articleTitle"
                  name="articleTitle"
                  placeholder="Sponsored article title"
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
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  disabled={isPending}
                />
              </div>
            </div>
          </div> */}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isPending}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <input type="hidden" name="isActive" value={isActive.toString()} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !category}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Sponsor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
