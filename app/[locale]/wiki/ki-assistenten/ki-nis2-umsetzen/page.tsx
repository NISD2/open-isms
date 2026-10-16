import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "ki-nis2-umsetzen",
  messages: "canAiImplement",
  art: "2_1",
  shot: "explain",
  steps: ["2.1", "2.2", "7.3"],
  level: "Beginner",
  audienceType: "Geschäftsführung und IT-Verantwortliche",
  citations: ["nis2", "cir-2024-2690"],
});

export const generateMetadata = page.metadata;
export default page.Page;
