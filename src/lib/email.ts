import { logger } from "@/lib/logger";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "RAN For Science <no-reply@ranforscience.com>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Called once at server startup (see src/instrumentation.ts). Fails fast in
 * production if email can't actually be delivered, instead of silently
 * dropping password-reset/verification emails at request time.
 */
export function assertEmailConfigured(): void {
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not set. Refusing to start in production without a working email provider " +
        "(password reset and email verification would otherwise silently fail to send)."
    );
  }

  if (!process.env.RESEND_API_KEY) {
    logger.warn("email_resend_not_configured_dev_mode");
  }
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Deliberately a raw console.log, not the structured logger: this is a
    // developer affordance for reading an otherwise-unsent reset/verification
    // link directly in the terminal, not an operational event — JSON-escaping
    // the HTML body would make the actual link harder to read/copy.
    console.log(`[email:DEV] Not actually sending an email. to=${to} subject="${subject}"\n${html}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

  if (result.error) {
    throw new Error(`Failed to send email via Resend: ${result.error.message}`);
  }
}
