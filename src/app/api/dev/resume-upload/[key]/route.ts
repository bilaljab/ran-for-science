import { NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { LOCAL_STORAGE_DIR } from "@/lib/storage";

/**
 * Dev-only stand-in for a real R2 presigned PUT, so local development still
 * works without Cloudflare credentials (R2 is optional in dev — see
 * .env.example). assertStorageConfigured() already refuses to boot in
 * production without R2 configured, so this route is unreachable there —
 * the NODE_ENV check below is defense in depth on top of that.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { key } = await params;
  if (!/^[0-9a-f-]{36}(\.(pdf|doc|docx))?$/i.test(key)) {
    return new NextResponse("Invalid key", { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  await mkdir(LOCAL_STORAGE_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_STORAGE_DIR, key), buffer);

  return new NextResponse(null, { status: 200 });
}
