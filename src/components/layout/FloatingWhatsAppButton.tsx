"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { WhatsappIcon } from "@/components/icons/SocialIcons";

const WHATSAPP_LINK = "https://wa.me/966560464352";
const SPRING = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function FloatingWhatsAppButton() {
  const t = useTranslations("social");

  return (
    <m.a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappFloating")}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={SPRING}
      className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
    >
      <WhatsappIcon className="h-7 w-7" />
    </m.a>
  );
}
