import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "assets-mit-ki-erfassen",
  messages: "assets",
  art: "2_2",
  shot: "assistantMark",
  steps: ["2.2", "2.3"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche",
  citations: ["nis2", "cir-2024-2690", "bsig"],
});

export const generateMetadata = page.metadata;
export default page.Page;
