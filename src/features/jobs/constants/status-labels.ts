import { ApplicationStatus } from "@/generated/prisma/enums";

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

export const applicationStatusValuesList = Object.values(ApplicationStatus);

export const applicationStatusOptions = applicationStatusValuesList.map((value) => ({
  value,
  label: applicationStatusLabels[value],
}));
