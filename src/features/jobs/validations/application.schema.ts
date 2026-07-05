import { z } from "zod";

export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export const jobApplicationSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+$/i, "Invalid job id"),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40),
  coverNote: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;

export const resumeFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0 && file.size <= MAX_RESUME_SIZE_BYTES, {
    message: "File must be between 1 byte and 5MB",
  })
  .refine((file) => ACCEPTED_RESUME_TYPES.includes(file.type), {
    message: "Only PDF and Word documents are accepted",
  })
  .refine((file) => file.name.length > 0 && file.name.length <= 255, {
    message: "File name is too long",
  });
