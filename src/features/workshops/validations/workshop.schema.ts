import { z } from "zod";

const required = "هذا الحقل مطلوب";
const text = (max: number) => z.string({ error: required }).trim().min(1, required).max(max, `الحد الأقصى ${max} حرفاً`);

export const workshopSchema = z.object({
  // Optional: left empty, the action generates one (Arabic titles can't be turned into a URL slug).
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,60}$/, "3 أحرف على الأقل، أحرف إنجليزية صغيرة وأرقام وشرطات فقط")
    .or(z.literal(""))
    .optional(),
  title: text(200),
  typeLabel: text(60),
  presenterName: text(150),
  // z.coerce.date() alone turns null/"" into 1970-01-01, so require a non-empty string first.
  workshopDate: z
    .string({ error: "تاريخ غير صالح" })
    .min(1, "تاريخ غير صالح")
    .pipe(z.coerce.date({ error: "تاريخ غير صالح" })),
  durationMinutes: z.coerce.number({ error: required }).int().min(1, "دقيقة واحدة على الأقل").max(120, "120 دقيقة كحد أقصى"),
});
