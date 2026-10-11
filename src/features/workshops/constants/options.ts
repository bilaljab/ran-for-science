// Stored verbatim as the response value, so CSV exports and the admin table
// read naturally without a label lookup. Adding an option needs no migration.
export const OTHER_OPTION = "أخرى";

export const EDUCATION_OPTIONS = ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", OTHER_OPTION] as const;
export const CURRENT_STATUS_OPTIONS = ["طالب", "حديث تخرج", "موظف", "باحث عن عمل", "صاحب عمل", OTHER_OPTION] as const;
export const BENEFIT_OPTIONS = ["نعم", "إلى حد ما", "لا", OTHER_OPTION] as const;

export const MAX_RATING = 5;

// Honeypot input name. Deliberately NOT "website"/"url"/"email"-like: browsers
// autofill those hidden fields from the user's profile, which would block a real student.
export const HONEYPOT_FIELD = "extra_info";

export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbDAHYxLo4haL6pHFe2f";
export const WHATSAPP_CHAT_URL = "https://wa.me/966560464352";
export const CONTACT_EMAIL = "Ran.for.science@gmail.com";
