import { z } from "zod";
import { ServiceCategory } from "@/generated/prisma/enums";

const serviceCategoryValues = Object.values(ServiceCategory) as [string, ...string[]];

export const quoteRequestSchema = z.object({
  category: z.enum(serviceCategoryValues),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40),
  message: z.string().trim().min(10).max(4000),
});
