-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('FREE_CONSULTATION', 'ENV_PERMITS', 'ENV_SURVEY_ASSESSMENT', 'ENV_REPORTS', 'ENV_REHABILITATION', 'ENV_TRAINING', 'ENV_WASTE_TRANSPORT', 'COMPANY_ISO_CERT', 'COMPANY_MARKETING', 'COMPANY_SOCIAL_MEDIA', 'LEGAL_CASES', 'LEGAL_CONTRACTS', 'LEGAL_CONSULTATION', 'DIGITAL_COMPANY_PROFILE', 'DIGITAL_BRANDING', 'DIGITAL_WEBSITE', 'DIGITAL_PRESENTATION', 'DIGITAL_FORMATTING');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('NEW', 'IN_REVIEW', 'CONTACTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('NEW', 'READ', 'RESPONDED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "requirementsAr" TEXT,
    "requirementsEn" TEXT,
    "field" TEXT,
    "location" TEXT,
    "jobType" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "resumeUrl" TEXT NOT NULL,
    "resumeFileName" TEXT NOT NULL,
    "coverNote" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceQuoteRequest" (
    "id" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "companyName" TEXT,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceQuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_slug_key" ON "JobPosting"("slug");

-- CreateIndex
CREATE INDEX "JobPosting_status_publishedAt_idx" ON "JobPosting"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "JobApplication_jobId_status_idx" ON "JobApplication"("jobId", "status");

-- CreateIndex
CREATE INDEX "ServiceQuoteRequest_category_status_idx" ON "ServiceQuoteRequest"("category", "status");

-- CreateIndex
CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
