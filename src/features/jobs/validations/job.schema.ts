import { z } from "zod";
import { JobType, JobStatus } from "@/generated/prisma/enums";

const jobTypeValues = Object.values(JobType) as [string, ...string[]];
const jobStatusValues = Object.values(JobStatus) as [string, ...string[]];

export const jobPostingSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  titleAr: z.string().trim().min(2).max(200),
  titleEn: z.string().trim().min(2).max(200),
  descriptionAr: z.string().trim().min(10).max(20000),
  descriptionEn: z.string().trim().min(10).max(20000),
  requirementsAr: z.string().trim().max(20000).optional().or(z.literal("")),
  requirementsEn: z.string().trim().max(20000).optional().or(z.literal("")),
  field: z.string().trim().max(100).optional().or(z.literal("")),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  jobType: z.enum(jobTypeValues),
  status: z.enum(jobStatusValues),
});
