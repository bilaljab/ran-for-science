-- CreateTable
CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "typeLabel" TEXT NOT NULL,
    "presenterName" TEXT NOT NULL,
    "workshopDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 10,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopResponse" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "educationOther" TEXT,
    "specialization" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "currentStatusOther" TEXT,
    "jobTitle" TEXT,
    "yearsExperience" TEXT,
    "organization" TEXT NOT NULL,
    "workshopRating" INTEGER NOT NULL,
    "presenterRating" INTEGER NOT NULL,
    "benefit" TEXT NOT NULL,
    "benefitOther" TEXT,
    "recommend" BOOLEAN NOT NULL,
    "desiredTopic" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkshopResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workshop_slug_key" ON "Workshop"("slug");

-- CreateIndex
CREATE INDEX "WorkshopResponse_workshopId_idx" ON "WorkshopResponse"("workshopId");

-- AddForeignKey
ALTER TABLE "WorkshopResponse" ADD CONSTRAINT "WorkshopResponse_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
