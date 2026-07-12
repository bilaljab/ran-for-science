import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  // Disable browser-language detection so `/` always serves Arabic directly
  // rather than issuing a redirect to `/en` for English-locale browsers.
  // Users switch language explicitly via the language switcher.
  localeDetection: false,
});
