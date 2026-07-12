import { randomUUID } from "crypto";
import path from "path";
import { readFile, unlink } from "fs/promises";
import { fileTypeFromBuffer } from "file-type";
import { logger } from "@/lib/logger";

export const LOCAL_STORAGE_DIR = path.join(process.cwd(), "storage", "uploads", "resumes");

const r2Configured = Boolean(
  process.env.R2_BUCKET && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
);

// Detected mime -> stored extension, used to verify already-uploaded bytes
// (see detectResumeContentType). Never trust the client-declared type alone.
const ALLOWED_RESUME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/x-cfb": ".doc", // legacy .doc is a generic OLE/CFB container
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

// Client-declared mime (from `file.type`) -> extension, used only to name the
// R2 object key at presign time, before any bytes exist server-side to sniff.
// This is cosmetic, not a security control — detectResumeContentType() after
// upload is the real gate.
const EXTENSION_BY_DECLARED_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const PRESIGN_EXPIRY_SECONDS = 600; // 10 min — long enough for a slow upload, short enough to bound orphan-object exposure.

/**
 * Called once at server startup (see src/instrumentation.ts). Fails fast in
 * production if R2 isn't configured, instead of silently falling back to
 * local disk — most hosting platforms (e.g. Vercel) have an ephemeral
 * filesystem that gets wiped on every deploy/restart, so resumes saved
 * there would quietly disappear with no error at upload time.
 */
export function assertStorageConfigured(): void {
  if (process.env.NODE_ENV === "production" && !r2Configured) {
    throw new Error(
      "R2 storage is not configured (R2_BUCKET/R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY). " +
        "Refusing to start in production without it — local disk storage is not durable on most hosting " +
        "platforms (e.g. Vercel's filesystem is ephemeral), so uploaded resumes would silently disappear " +
        "on the next deploy or restart."
    );
  }

  if (!r2Configured) {
    logger.warn("storage_r2_not_configured_using_local_disk");
  }
}

async function getS3Client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function buildResumeKey(declaredMimeType: string): string {
  const ext = EXTENSION_BY_DECLARED_MIME[declaredMimeType] ?? "";
  return `${randomUUID()}${ext}`;
}

/**
 * Returns a URL the browser can PUT the resume bytes to directly, bypassing
 * our own server entirely for the (potentially large) file body — see
 * apply.actions.ts/presign-resume.actions.ts for why. In dev without R2
 * configured, falls back to a local route that mimics the same PUT contract
 * (src/app/api/dev/resume-upload/[key]/route.ts).
 *
 * Deliberately does not bind ContentType into the signed command: doing so
 * would require the browser's PUT to send back byte-for-byte the same
 * Content-Type header or R2 rejects the signature — content-type isn't a
 * trust boundary either way (detectResumeContentType is), so there's no
 * security benefit to that fragility.
 *
 * Known, accepted risk (not fixable from this signature alone): a presigned
 * PUT URL — unlike a presigned POST policy — has no mechanism to bind a
 * max Content-Length; SigV4 can only sign an EXACT byte count, which would
 * reject every upload that isn't precisely that size, so no useful bound
 * can be enforced here. This means a caller that obtains a presigned key
 * (rate-limited to 10 per 10 minutes per IP — see presign-resume.actions.ts)
 * can PUT an arbitrarily large object directly to R2 without ever calling
 * submitJobApplication, which is the only place that checks
 * MAX_RESUME_SIZE_BYTES and deletes on failure. Exposure is bounded by the
 * presign rate limit, the 10-minute URL expiry, and the attacker's own
 * upload bandwidth — not by anything at the storage layer. This does NOT
 * expose data (downloads are always proxied through the authenticated
 * admin route, which forces a fixed response Content-Type regardless of
 * what's in the bucket) — the exposure is storage-cost/DoS, not
 * confidentiality. Recommended mitigation outside application code: add an
 * R2 lifecycle rule (Cloudflare dashboard) to auto-delete objects older
 * than a few hours, cleaning up anything that was never confirmed via
 * submitJobApplication. Switching to presigned POST with a
 * content-length-range condition would enforce this at the protocol level
 * instead, but that's a bigger change (rewrites the upload call in
 * ApplyForm.tsx and the dev-only PUT stand-in route to match) than this
 * pass covers.
 */
export async function getResumeUploadUrl(key: string): Promise<string> {
  if (r2Configured) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const client = await getS3Client();
    const command = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key });
    return getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
  }

  return `/api/dev/resume-upload/${encodeURIComponent(key)}`;
}

/**
 * Verifies actual file content via magic bytes — the client-supplied
 * `file.type` MIME header is attacker-controlled and not trustworthy on its
 * own. Run this against bytes read back from storage after upload (never
 * against a request body directly), so it works the same whether the file
 * arrived via direct-to-R2 upload or local disk.
 */
export async function detectResumeContentType(buffer: Buffer): Promise<string | null> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_RESUME_TYPES[detected.mime]) return null;
  return detected.mime;
}

export async function readResumeFile(key: string): Promise<Buffer> {
  if (r2Configured) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    const res = await client.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    const byteArray = await res.Body!.transformToByteArray();
    return Buffer.from(byteArray);
  }

  return readFile(path.join(LOCAL_STORAGE_DIR, key));
}

export async function deleteResumeFile(key: string): Promise<void> {
  if (r2Configured) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return;
  }

  try {
    await unlink(path.join(LOCAL_STORAGE_DIR, key));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
