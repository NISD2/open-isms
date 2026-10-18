import { policyPage } from "@/components/wiki/PolicyArticle";

const page = policyPage({
  slug: "risikobewertung-methodik",
  messages: "riskMethodology",
  art: "2_1",
  shot: "bsiMethod",
  steps: ["2.1", "2.3", "2.4"],
  level: "Intermediate",
  audienceType: "CISO, IT-Verantwortliche und Geschäftsleitung",
  citations: ["nis2", "cir-2024-2690", "bsig"],
});

export const generateMetadata = page.metadata;
export default page.Page;
