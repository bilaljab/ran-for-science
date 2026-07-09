-- CreateEnum
CREATE TYPE "FingerprintScope" AS ENUM ('ADMIN', 'PUBLIC');

-- Existing BlockedFingerprint rows predate the admin/public scope split and
-- can't be correctly attributed to either after the fact (that ambiguity is
-- exactly the bug this migration fixes) — this table only ever holds
-- transient, self-renewing 30-day blocks, never durable history, so clearing
-- it is safe; both scopes repopulate correctly from here on.
TRUNCATE TABLE "BlockedFingerprint";

-- DropIndex
DROP INDEX "BlockedFingerprint_fingerprint_key";

-- AlterTable
ALTER TABLE "BlockedFingerprint" ADD COLUMN "scope" "FingerprintScope" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BlockedFingerprint_fingerprint_scope_key" ON "BlockedFingerprint"("fingerprint", "scope");
