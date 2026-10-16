import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "richtlinien-mit-ki-schreiben",
  messages: "policies",
  art: "2_4",
  shot: "approved",
  steps: ["2.4", "9.1", "10.1"],
  level: "Intermediate",
  audienceType: "CISO und IT-Verantwortliche",
  citations: ["nis2", "cir-2024-2690"],
});

export const generateMetadata = page.metadata;
export default page.Page;
