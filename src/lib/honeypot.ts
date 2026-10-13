// Honeypot input name shared by every public form. Deliberately NOT
// "website"/"url"/"email"-like: browsers and password managers autofill those
// hidden fields from the user's profile, which would block a real visitor.
export const HONEYPOT_FIELD = "extra_info";
