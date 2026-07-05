import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed accounts are auto-verified (no email-verification email is sent for
  // them) because provisioning happens through this script, which already
  // requires direct database/environment access — a real out-of-band
  // verification email would add no additional trust here. To keep that
  // shortcut safe, this script must never run in a real production
  // environment (it would otherwise be a way to mint "verified" accounts
  // without any actual verification).
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "prisma/seed.ts must not run in production. Create admin accounts through a proper provisioning path instead."
    );
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set before seeding — refusing to create an admin user with a default/guessable password."
    );
  }

  if (adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters long.");
  }

  const passwordHash = await hashPassword(adminPassword);
  const now = new Date();

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, passwordChangedAt: now, emailVerified: now },
    create: {
      email: adminEmail,
      passwordHash,
      name: "RAN For Science Admin",
      passwordChangedAt: now,
      emailVerified: now,
    },
  });

  console.log(`Seeded admin user: ${adminEmail}`);

  const sampleJobs = [
    {
      slug: "environmental-compliance-specialist",
      titleAr: "أخصائي امتثال بيئي",
      titleEn: "Environmental Compliance Specialist",
      descriptionAr:
        "نبحث عن أخصائي امتثال بيئي للانضمام إلى فريق إحدى الشركات الصناعية الشريكة، للإشراف على التصاريح والتقارير البيئية والتأكد من الالتزام بالأنظمة المحلية.",
      descriptionEn:
        "We are looking for an Environmental Compliance Specialist to join a partner industrial company, overseeing environmental permits and reports and ensuring compliance with local regulations.",
      requirementsAr:
        "بكالوريوس في العلوم البيئية أو ما يعادلها، خبرة لا تقل عن سنتين في مجال الامتثال البيئي، إجادة إعداد التقارير الفنية.",
      requirementsEn:
        "Bachelor's degree in Environmental Science or equivalent, at least 2 years of experience in environmental compliance, strong technical report writing skills.",
      field: "بيئي",
      location: "الرياض، السعودية",
      jobType: "FULL_TIME" as const,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    },
    {
      slug: "lab-quality-control-analyst",
      titleAr: "محلل ضبط جودة مختبر",
      titleEn: "Lab Quality Control Analyst",
      descriptionAr:
        "فرصة عمل لدى شركة شريكة في القطاع الصناعي لتحليل عينات الجودة في المختبر وإعداد تقارير الفحص الدورية.",
      descriptionEn:
        "A job opportunity with a partner company in the industrial sector to analyze quality samples in the lab and prepare periodic inspection reports.",
      requirementsAr: "بكالوريوس كيمياء أو علوم مخبرية، خبرة عملية في المختبرات الصناعية تعتبر ميزة إضافية.",
      requirementsEn:
        "Bachelor's degree in Chemistry or Laboratory Science, hands-on experience in industrial labs is a plus.",
      field: "علمي",
      location: "جدة، السعودية",
      jobType: "FULL_TIME" as const,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    },
    {
      slug: "health-safety-officer-internship",
      titleAr: "متدرب ضابط صحة وسلامة",
      titleEn: "Health & Safety Officer Intern",
      descriptionAr: "برنامج تدريبي لمدة 3 أشهر في مجال الصحة والسلامة المهنية لدى إحدى الشركات الصحية الشريكة.",
      descriptionEn:
        "A 3-month internship program in occupational health and safety with one of our partner healthcare companies.",
      requirementsAr: "طالب أو خريج حديث في تخصص الصحة العامة أو السلامة المهنية.",
      requirementsEn: "Student or recent graduate in Public Health or Occupational Safety.",
      field: "صحي",
      location: "عن بُعد",
      jobType: "INTERNSHIP" as const,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    },
  ];

  for (const job of sampleJobs) {
    await prisma.jobPosting.upsert({
      where: { slug: job.slug },
      update: {},
      create: job,
    });
  }

  console.log(`Seeded ${sampleJobs.length} sample job postings`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
