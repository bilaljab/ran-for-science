import { z } from "zod";
import { ACCEPTED_RESUME_TYPES, MAX_RESUME_SIZE_BYTES } from "./application.constants";

export { MAX_RESUME_SIZE_BYTES };

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

// Input to the presign action: gauntlet fields (same shape as the other
// public actions) plus file metadata only — no raw File, since the browser
// hasn't uploaded anything yet at this point. This is the real server-side
// trust boundary for these fields; the client pre-validates in ApplyForm
// before calling this action.
export const presignResumeInputSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+$/i, "Invalid job id"),
  website: z.string().max(200).optional().default(""),
  // Always a string in practice — it's read via FormData.get() on a hidden
  // input (see FormTimingGuard) — kept nullable since a missing field reads
  // as null, which isTooFast already treats as "too fast".
  formRenderedAt: z.string().nullable().optional(),
  fp: z.string().max(128).optional().default(""),
  fpBot: z.string().optional().default(""),
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_RESUME_SIZE_BYTES),
  mimeType: z.string().refine((v) => (ACCEPTED_RESUME_TYPES as readonly string[]).includes(v), "Unsupported file type"),
});

// The server generates keys as randomUUID + one of three known extensions.
// Constraining resumeKey to that exact shape means a tampered form field
// can't point submitJobApplication — or the admin download route, which
// trusts resumeUrl as a storage key — at an arbitrary/unrelated R2 object.
export const resumeRefSchema = z.object({
  key: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx)$/i,
      "Invalid resume reference"
    ),
  fileName: z.string().trim().min(1).max(255),
});
