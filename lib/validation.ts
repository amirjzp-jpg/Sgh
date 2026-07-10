import { z } from "zod";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(200),
  city: z.string().trim().min(2).max(60).default("Vancouver"),
});

const imageSchema = z
  .string()
  .max(900_000) // ~650KB binary as a data URL; plenty for a resized demo photo
  .refine((s) => s.startsWith("data:image/") || s.startsWith("/"), {
    message: "Images must be uploaded files or local paths",
  });

export const listingSchema = z.object({
  title: z.string().trim().min(3).max(90),
  description: z.string().trim().min(10).max(3000),
  priceCents: z.number().int().min(100).max(5_000_000),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  images: z.array(imageSchema).min(1).max(4),
});

export const listingUpdateSchema = z.object({
  status: z.enum(["active", "removed"]),
});

export const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const offerSchema = z.object({
  listingId: z.string().min(1),
  amountCents: z.number().int().min(100).max(5_000_000),
});

export const offerActionSchema = z.object({
  action: z.enum(["accept", "decline", "counter"]),
  counterAmountCents: z.number().int().min(100).max(5_000_000).optional(),
});

// Card fields are validated for shape but NEVER persisted — see lib/payments/mock.ts
export const checkoutSchema = z.object({
  listingId: z.string().min(1),
  offerId: z.string().min(1).optional(),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY"),
  cardCvc: z.string().regex(/^\d{3,4}$/, "3 or 4 digits"),
  cardName: z.string().trim().min(2).max(80),
});

export const advanceSchema = z.object({
  status: z.enum(["picked_up", "in_transit", "delivered"]),
});

export const withdrawSchema = z.object({
  amountCents: z.number().int().min(100),
});

export const reviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(1000),
});

export const reportSchema = z
  .object({
    targetUserId: z.string().min(1).optional(),
    listingId: z.string().min(1).optional(),
    reason: z.string().trim().min(3).max(1000),
  })
  .refine((r) => r.targetUserId || r.listingId, {
    message: "A report needs a target user or listing",
  });

export const blockSchema = z.object({
  blockedId: z.string().min(1),
});
