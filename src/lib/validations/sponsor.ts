import { z } from "zod";

export const newsCategoryValues = [
  "ENCODING_AND_SOFTWARE",
  "VIDEO_DELIVERY_AND_CDN",
  "VIDEO_STREAMING_AND_DELIVERY_PLATFORMS",
  "ARTIFICIAL_INTELLIGENCE_FOR_VIDEO_APPLICATIONS",
  "PRODUCTION_HARDWARE",
  "BUSINESS_NEWS",
  "MONETIZATION_AND_AD_TECH",
  "REGULATORY_AND_POLICY",
] as const;

export const sponsorSchema = z.object({
  name: z.string().min(1, "Sponsor name is required"),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  articleTitle: z.string().optional(),
  articleContent: z.string().optional(),
  articleUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  underNewsCategory: z.enum(newsCategoryValues).optional().nullable(),
});

export const updateSponsorSchema = sponsorSchema.extend({
  id: z.string().uuid(),
}).partial().required({ id: true });

export type SponsorFormData = z.infer<typeof sponsorSchema>;
export type UpdateSponsorFormData = z.infer<typeof updateSponsorSchema>;
