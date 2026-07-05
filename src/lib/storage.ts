import { randomUUID } from "crypto";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { fileTypeFromBuffer } from "file-type";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "storage", "uploads", "resumes");

const r2Configured = Boolean(
  process.env.R2_BUCKET && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
);

// Detected mime -> stored extension. The extension is chosen from the verified
// file content, never from the user-supplied original filename, so a renamed
// payload can't smuggle an unexpected extension onto disk.
const ALLOWED_RESUME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/x-cfb": ".doc", // legacy .doc is a generic OLE/CFB container
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export class InvalidFileContentError extends Error {}

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
    console.warn(
      "[storage] R2 is not configured — falling back to local disk storage (dev only). " +
        "Uploaded resumes will NOT persist across deploys/restarts in a real deployment."
    );
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

export async function saveResumeFile(file: File): Promise<{ key: string; fileName: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Verify the actual file content via magic bytes — the client-supplied
  // `file.type` MIME header is attacker-controlled and not trustworthy on its own.
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_RESUME_TYPES[detected.mime]) {
    throw new InvalidFileContentError("Only real PDF or Word documents are accepted.");
  }
  const ext = ALLOWED_RESUME_TYPES[detected.mime];

  const key = `${randomUUID()}${ext}`;

  if (r2Configured) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: detected.mime,
      })
    );
  } else {
    await mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_STORAGE_DIR, key), buffer);
  }

  return { key, fileName: file.name };
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
