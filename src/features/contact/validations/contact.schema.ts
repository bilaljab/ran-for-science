import { z } from "zod";
import { noNul, NO_NUL_MESSAGE } from "@/lib/validation";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120).refine(noNul, NO_NUL_MESSAGE),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).refine(noNul, NO_NUL_MESSAGE).optional().or(z.literal("")),
  subject: z.string().trim().max(160).refine(noNul, NO_NUL_MESSAGE).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(4000).refine(noNul, NO_NUL_MESSAGE),
});
