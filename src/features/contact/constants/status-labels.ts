import { MessageStatus } from "@/generated/prisma/enums";

const messageStatusLabels: Record<string, string> = {
  NEW: "جديد",
  READ: "مقروء",
  RESPONDED: "تم الرد",
};

export const messageStatusOptions = Object.values(MessageStatus).map((value) => ({
  value,
  label: messageStatusLabels[value],
}));
