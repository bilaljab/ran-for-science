import { logger } from "@/lib/logger";

type AbuseEvent = {
  type: string;
  ip: string;
  detail?: string;
};

/**
 * Single funnel for every abuse-relevant event (failed logins, rate-limit
 * trips, CAPTCHA failures, IP auto-blocks...) tagged with one grep-able
 * event name. Centralizing it here means swapping in a real sink (Sentry,
 * Axiom, CloudWatch, a SIEM) later is a one-function change instead of
 * hunting down every scattered log call site.
 */
export function logAbuseEvent({ type, ip, detail }: AbuseEvent): void {
  logger.warn({ type, ip, detail }, "abuse_event");
}
