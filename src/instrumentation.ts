import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    const { assertEmailConfigured } = await import("@/lib/email");
    assertEmailConfigured();

    const { assertStorageConfigured } = await import("@/lib/storage");
    assertStorageConfigured();

    const { assertCaptchaConfigured } = await import("@/lib/captcha");
    assertCaptchaConfigured();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
