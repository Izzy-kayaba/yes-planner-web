import { z } from "zod";

export const supportCategories = [
  "Account",
  "Wedding",
  "Vendor / Business",
  "Venue",
  "RSVP / Guest",
  "Technical Problem",
  "Billing",
  "Verification",
  "Other",
] as const;

export const manageableSupportStatuses = [
  "Open",
  "In Progress",
  "Waiting for User",
  "Resolved",
  "Closed",
] as const;
export const supportStatuses = ["New", ...manageableSupportStatuses] as const;

export const supportRequestSchema = z.object({
  category: z.enum(supportCategories),
  subject: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(4_000),
  relatedWeddingKey: z.string().trim().min(1).max(160).optional(),
});

export const supportStatusSchema = z.object({
  requestId: z.string().regex(/^[a-f\d]{24}$/i),
  status: z.enum(manageableSupportStatuses),
});
