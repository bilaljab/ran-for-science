import { Leaf, Building2, Scale, Laptop, type LucideIcon } from "lucide-react";
import { ServiceCategory } from "@/generated/prisma/enums";

export const serviceCategoryLabelKeys: Record<ServiceCategory, string> = {
  FREE_CONSULTATION: "services.free.consultation.title",
  ENV_PERMITS: "services.categories.environmental.items.envPermits",
  ENV_SURVEY_ASSESSMENT: "services.categories.environmental.items.envSurveyAssessment",
  ENV_REPORTS: "services.categories.environmental.items.envReports",
  ENV_REHABILITATION: "services.categories.environmental.items.envRehabilitation",
  ENV_TRAINING: "services.categories.environmental.items.envTraining",
  ENV_WASTE_TRANSPORT: "services.categories.environmental.items.envWasteTransport",
  COMPANY_ISO_CERT: "services.categories.company.items.companyIsoCert",
  COMPANY_MARKETING: "services.categories.company.items.companyMarketing",
  COMPANY_SOCIAL_MEDIA: "services.categories.company.items.companySocialMedia",
  LEGAL_CASES: "services.categories.legal.items.legalCases",
  LEGAL_CONTRACTS: "services.categories.legal.items.legalContracts",
  LEGAL_CONSULTATION: "services.categories.legal.items.legalConsultation",
  DIGITAL_COMPANY_PROFILE: "services.categories.digital.items.digitalCompanyProfile",
  DIGITAL_BRANDING: "services.categories.digital.items.digitalBranding",
  DIGITAL_WEBSITE: "services.categories.digital.items.digitalWebsite",
  DIGITAL_PRESENTATION: "services.categories.digital.items.digitalPresentation",
  DIGITAL_FORMATTING: "services.categories.digital.items.digitalFormatting",
};

export const categoryGroups = [
  {
    key: "environmental",
    titleKey: "services.categories.environmental.title",
    categories: [
      ServiceCategory.ENV_PERMITS,
      ServiceCategory.ENV_SURVEY_ASSESSMENT,
      ServiceCategory.ENV_REPORTS,
      ServiceCategory.ENV_REHABILITATION,
      ServiceCategory.ENV_TRAINING,
      ServiceCategory.ENV_WASTE_TRANSPORT,
    ],
  },
  {
    key: "company",
    titleKey: "services.categories.company.title",
    categories: [
      ServiceCategory.COMPANY_ISO_CERT,
      ServiceCategory.COMPANY_MARKETING,
      ServiceCategory.COMPANY_SOCIAL_MEDIA,
    ],
  },
  {
    key: "legal",
    titleKey: "services.categories.legal.title",
    categories: [
      ServiceCategory.LEGAL_CASES,
      ServiceCategory.LEGAL_CONTRACTS,
      ServiceCategory.LEGAL_CONSULTATION,
    ],
  },
  {
    key: "digital",
    titleKey: "services.categories.digital.title",
    categories: [
      ServiceCategory.DIGITAL_COMPANY_PROFILE,
      ServiceCategory.DIGITAL_BRANDING,
      ServiceCategory.DIGITAL_WEBSITE,
      ServiceCategory.DIGITAL_PRESENTATION,
      ServiceCategory.DIGITAL_FORMATTING,
    ],
  },
] as const;

export const categoryGroupIcons: Record<(typeof categoryGroups)[number]["key"], LucideIcon> = {
  environmental: Leaf,
  company: Building2,
  legal: Scale,
  digital: Laptop,
};
