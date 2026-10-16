import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "risiken-mit-ki-bewerten",
  messages: "risks",
  art: "2_3",
  shot: "riskMap",
  steps: ["2.1", "2.3", "7.3"],
  level: "Intermediate",
  audienceType: "CISO und Geschäftsführung",
  citations: ["nis2", "cir-2024-2690"],
});

export const generateMetadata = page.metadata;
export default page.Page;
