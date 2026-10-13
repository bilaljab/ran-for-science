import { z } from "zod";
import { ServiceCategory } from "@/generated/prisma/enums";
import { noNul, NO_NUL_MESSAGE } from "@/lib/validation";

const serviceCategoryValues = Object.values(ServiceCategory) as [string, ...string[]];

export const quoteRequestSchema = z.object({
  category: z.enum(serviceCategoryValues),
  companyName: z.string().trim().max(160).refine(noNul, NO_NUL_MESSAGE).optional().or(z.literal("")),
  contactName: z.string().trim().min(2).max(120).refine(noNul, NO_NUL_MESSAGE),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40).refine(noNul, NO_NUL_MESSAGE),
  message: z.string().trim().min(10).max(4000).refine(noNul, NO_NUL_MESSAGE),
});
