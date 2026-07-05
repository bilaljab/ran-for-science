export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEmailConfigured } = await import("@/lib/email");
    assertEmailConfigured();

    const { assertStorageConfigured } = await import("@/lib/storage");
    assertStorageConfigured();
  }
}
