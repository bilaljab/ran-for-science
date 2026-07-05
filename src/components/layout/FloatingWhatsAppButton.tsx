import { useTranslations } from "next-intl";
import { WhatsappIcon } from "@/components/icons/SocialIcons";

const WHATSAPP_LINK = "https://wa.me/966560464352";

export default function FloatingWhatsAppButton() {
  const t = useTranslations("social");

  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappFloating")}
      className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
}
