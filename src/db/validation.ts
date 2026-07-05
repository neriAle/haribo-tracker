import { z } from "zod";

const ratingSchema = z
  .number()
  .min(0.5, { error: "Rating must be at least 0.5" })
  .max(5, { error: "Rating cannot exceed 5.0" })
  .refine((val) => val % 0.5 === 0, {
    message: "Rating must be in 0.5 increments",
  })
  .nullable()
  .optional();

export const insertPacketSchema = z.object({
  name: z.string({ error: "Name is mandatory" }).min(1),
  language: z.string({ error: "Language is mandatory" }).min(1),
  imageUrl: z.url({ error: "Must be a valid URL" }),
  categoryIds: z
    .array(z.number())
    .min(1, { error: "At least one category is required" }),
  dateAcquired: z.string().nullable().optional(),
  locationAcquired: z.string().nullable().optional(),
  rating: ratingSchema,
  comment: z.string().nullable().optional(),
});

// For PUT requests: allows partial updates
export const updatePacketSchema = insertPacketSchema.partial().extend({
  name: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
  imageUrl: z.url().optional(),
  categoryIds: z.array(z.number()).min(1).optional(),
});
