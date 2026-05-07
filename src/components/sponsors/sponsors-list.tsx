"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
  Megaphone,
  Loader2,
  Globe,
  Calendar,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { toAppTime } from "@/lib/utils/date";
import { toggleSponsorStatus, deleteSponsor, promoteSponsorToTopNews } from "@/lib/actions/sponsors";
import { EditSponsorDialog } from "./edit-sponsor-dialog";
import type { Sponsor } from "@/lib/db/schema";

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

interface SponsorsListProps {
  sponsors: Sponsor[];
  currentTopNewsSponsorId?: string | null;
}

export function SponsorsList({ sponsors, currentTopNewsSponsorId }: SponsorsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sponsorToEdit, setSponsorToEdit] = useState<Sponsor | null>(null);

  const handleToggleStatus = (sponsor: Sponsor) => {
    const formData = new FormData();
    formData.append("id", sponsor.id);

    startTransition(async () => {
      const result = await toggleSponsorStatus({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    });
  };

  const handlePromoteToTopNews = (sponsorId: string) => {
    const formData = new FormData();
    formData.append("sponsorId", sponsorId);

    startTransition(async () => {
      const result = await promoteSponsorToTopNews({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!sponsorToDelete) return;

    const formData = new FormData();
    formData.append("id", sponsorToDelete.id);

    startTransition(async () => {
      const result = await deleteSponsor({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Sponsor deleted");
        router.refresh();
      }
      setDeleteDialogOpen(false);
      setSponsorToDelete(null);
    });
  };

  if (sponsors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Sponsors</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Add sponsors to include sponsored content in your newsletter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...sponsors]
          .sort((a, b) => {
            if (!a.underNewsCategory && !b.underNewsCategory) return 0;
            if (!a.underNewsCategory) return 1;
            if (!b.underNewsCategory) return -1;
            return a.underNewsCategory.localeCompare(b.underNewsCategory);
          })
          .map((sponsor) => (
          <Card key={sponsor.id} className="relative">
            {sponsor.underNewsCategory && (
              <Badge variant="outline" className="absolute top-2 left-5 text-xs">
                {categoryLabels[sponsor.underNewsCategory] || sponsor.underNewsCategory}
              </Badge>
            )}
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {sponsor.logoUrl ? (
                    <div className="w-10 h-10 rounded bg-slate-300 dark:bg-slate-700 flex items-center justify-center p-0.5 shrink-0">
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="w-full h-full rounded object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Megaphone className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {sponsor.websiteUrl ? (
                          <a
                            href={sponsor.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {sponsor.name}
                          </a>
                        ) : (
                          sponsor.name
                        )}
                      </CardTitle>
                      {currentTopNewsSponsorId === sponsor.id && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={sponsor.isActive ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
                      >
                        {sponsor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSponsorToEdit(sponsor);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {sponsor.isActive && (
                      <>
                        <DropdownMenuSeparator />
                        {currentTopNewsSponsorId === sponsor.id ? (
                          <DropdownMenuItem disabled>
                            <Star className="h-4 w-4 mr-2 text-amber-500 fill-amber-500" />
                            Today&apos;s Top News
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handlePromoteToTopNews(sponsor.id)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Promote to Top News
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setSponsorToDelete(sponsor);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* {sponsor.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {sponsor.description}
                </p>
              )} */}

              {sponsor.headline && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium line-clamp-1">
                    {sponsor.headline}
                  </p>
                  {sponsor.ctaUrl && (
                    <a
                      href={sponsor.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      View article <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                {/* <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {sponsor.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(toAppTime(sponsor.startDate), "MMM d")}
                      {sponsor.endDate && (
                        <> - {format(toAppTime(sponsor.endDate), "MMM d")}</>
                      )}
                    </div>
                  )}
                </div> */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={sponsor.isActive}
                    onCheckedChange={() => handleToggleStatus(sponsor)}
                    disabled={isPending}
                    className="data-[state=checked]:bg-emerald-600/90 dark:data-[state=checked]:bg-emerald-600/80"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sponsor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{sponsorToDelete?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSponsorToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {sponsorToEdit && (
        <EditSponsorDialog
          sponsor={sponsorToEdit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSponsorToEdit(null);
          }}
        />
      )}
    </>
  );
}
