-- CreateTable
CREATE TABLE "AbuseCounter" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbuseCounter_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "AbuseCounter_lockedUntil_idx" ON "AbuseCounter"("lockedUntil");
