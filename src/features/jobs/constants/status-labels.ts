import { JobStatus, ApplicationStatus } from "@/generated/prisma/enums";

type Tone = "primary" | "mint" | "mauve" | "neutral";

export const jobStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  CLOSED: "مغلقة",
};

export const jobStatusTones: Record<string, Tone> = {
  DRAFT: "neutral",
  PUBLISHED: "mint",
  CLOSED: "neutral",
};

export const applicationStatusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  SHORTLISTED: "مرشّح",
  INTERVIEW: "مقابلة",
  REJECTED: "مرفوض",
  HIRED: "تم التوظيف",
};

export const applicationStatusTones: Record<string, Tone> = {
  PENDING: "neutral",
  SHORTLISTED: "primary",
  INTERVIEW: "mauve",
  REJECTED: "neutral",
  HIRED: "mint",
};

export const jobStatusValuesList = Object.values(JobStatus);
export const applicationStatusValuesList = Object.values(ApplicationStatus);
