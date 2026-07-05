-- CreateTable
CREATE TABLE "BlockedFingerprint" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "strikes" INTEGER NOT NULL DEFAULT 1,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedFingerprint_fingerprint_key" ON "BlockedFingerprint"("fingerprint");
