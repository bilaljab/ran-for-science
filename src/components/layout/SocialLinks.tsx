import { useTranslations } from "next-intl";
import {
  LinkedinIcon,
  TelegramIcon,
  WhatsappIcon,
  TiktokIcon,
  InstagramIcon,
} from "@/components/icons/SocialIcons";
import { cn } from "@/lib/utils";

export function SocialLinks({ className }: { className?: string }) {
  const t = useTranslations("social");

  const links = [
    { href: t("linkedin"), label: "LinkedIn", Icon: LinkedinIcon },
    { href: t("telegram"), label: "Telegram", Icon: TelegramIcon },
    { href: t("whatsapp"), label: "WhatsApp", Icon: WhatsappIcon },
    { href: t("tiktok"), label: "TikTok", Icon: TiktokIcon },
    { href: t("instagram"), label: "Instagram", Icon: InstagramIcon },
  ];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors hover:bg-primary-500 hover:text-white"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
