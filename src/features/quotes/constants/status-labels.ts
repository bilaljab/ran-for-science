import { QuoteStatus } from "@/generated/prisma/enums";

const quoteStatusLabels: Record<string, string> = {
  NEW: "جديد",
  IN_REVIEW: "قيد المراجعة",
  CONTACTED: "تم التواصل",
  CLOSED: "مغلق",
};

export const quoteStatusOptions = Object.values(QuoteStatus).map((value) => ({
  value,
  label: quoteStatusLabels[value],
}));
