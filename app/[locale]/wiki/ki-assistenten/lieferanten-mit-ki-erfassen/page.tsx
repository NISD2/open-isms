import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "lieferanten-mit-ki-erfassen",
  messages: "suppliers",
  art: "5_1",
  shot: "path",
  steps: ["5.1", "5.2"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche und Einkauf",
  citations: ["nis2", "cir-2024-2690"],
});

export const generateMetadata = page.metadata;
export default page.Page;
