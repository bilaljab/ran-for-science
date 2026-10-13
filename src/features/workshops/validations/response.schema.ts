import { z } from "zod";
import {
  BENEFIT_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  EDUCATION_OPTIONS,
  MAX_RATING,
  OTHER_OPTION,
} from "@/features/workshops/constants/options";
import { noNul, NO_NUL_MESSAGE } from "@/lib/validation";

const required = "هذا الحقل مطلوب";
const text = (max: number) =>
  z.string({ error: required }).trim().min(1, required).max(max, `الحد الأقصى ${max} حرفاً`).refine(noNul, NO_NUL_MESSAGE);
const optionalText = (max: number) =>
  z.string().trim().max(max, `الحد الأقصى ${max} حرفاً`).refine(noNul, NO_NUL_MESSAGE).optional();
const choice = <T extends readonly [string, ...string[]]>(options: T) => z.enum(options, { error: required });
const rating = z.coerce.number({ error: required }).int().min(1, required).max(MAX_RATING, required);

// Arabic letters (incl. diacritics) and spaces only, at least two words — the
// value is printed on the certificate exactly as typed (whitespace collapsed).
const arabicFullName = z
  .string({ error: required })
  .trim()
  .transform((value) => value.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1, required)
      .max(100, "الحد الأقصى 100 حرف")
      .regex(/^[؀-ۿ ]+$/, "اكتب الاسم بالأحرف العربية فقط")
      .refine((value) => value.split(" ").length >= 2, "اكتب اسمك الكامل (الاسم الأول واسم العائلة على الأقل)")
  );

export const workshopResponseSchema = z
  .object({
    fullName: arabicFullName,
    nationality: text(60),
    education: choice(EDUCATION_OPTIONS),
    educationOther: optionalText(80),
    specialization: text(120),
    currentStatus: choice(CURRENT_STATUS_OPTIONS),
    currentStatusOther: optionalText(80),
    jobTitle: optionalText(100),
    yearsExperience: optionalText(20),
    organization: text(150),
    workshopRating: rating,
    presenterRating: rating,
    benefit: choice(BENEFIT_OPTIONS),
    benefitOther: optionalText(120),
    recommend: z.enum(["نعم", "لا"], { error: required }).transform((value) => value === "نعم"),
    desiredTopic: text(500),
    notes: text(2000),
  })
  .superRefine((data, ctx) => {
    const others = [
      ["education", "educationOther"],
      ["currentStatus", "currentStatusOther"],
      ["benefit", "benefitOther"],
    ] as const;
    for (const [field, otherField] of others) {
      if (data[field] === OTHER_OPTION && !data[otherField]) {
        ctx.addIssue({ code: "custom", path: [otherField], message: "اكتب التفاصيل" });
      }
    }
  });
