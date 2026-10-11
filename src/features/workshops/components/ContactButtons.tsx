import { GmailIcon, WhatsappIcon } from "@/components/icons/SocialIcons";
import { CONTACT_EMAIL, WHATSAPP_CHANNEL_URL, WHATSAPP_CHAT_URL } from "@/features/workshops/constants/options";
import { cn } from "@/lib/utils";

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

// Branded contact actions instead of a bare phone number / URL / address.
// `compact` = round icon buttons (footer); default = full-width labelled buttons.
export function ContactButtons({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    const round = "flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95";
    return (
      <div className={cn("flex items-center justify-center gap-3", className)}>
        <a href={WHATSAPP_CHANNEL_URL} {...external} aria-label="قناة RAN على واتساب" title="قناة RAN على واتساب" className={cn(round, "bg-[#E7F8EE] text-[#128C7E] hover:bg-[#25D366] hover:text-[#052e1a]")}>
          <WhatsappIcon className="h-6 w-6" />
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} aria-label="راسلنا عبر البريد الإلكتروني" title="راسلنا عبر البريد الإلكتروني" className={cn(round, "bg-[#FDECEA] text-[#D93025] hover:bg-[#D93025] hover:text-white")}>
          <GmailIcon className="h-6 w-6" />
        </a>
      </div>
    );
  }

  const button = "flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]";
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <a href={WHATSAPP_CHANNEL_URL} {...external} className={cn(button, "bg-[#25D366] text-[#052e1a]")}>
        <WhatsappIcon className="h-6 w-6" />
        انضم إلى قناة RAN على واتساب
      </a>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a href={WHATSAPP_CHAT_URL} {...external} className={cn(button, "border border-[#25D366]/40 bg-white text-primary-900")}>
          <WhatsappIcon className="h-6 w-6 text-[#128C7E]" />
          راسلنا على واتساب
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className={cn(button, "border border-[#D93025]/30 bg-white text-primary-900")}>
          <GmailIcon className="h-6 w-6 text-[#D93025]" />
          راسلنا عبر Gmail
        </a>
      </div>
    </div>
  );
}
