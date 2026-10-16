import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "nachweise-mit-ki-hochladen",
  messages: "evidence",
  art: "8_2",
  shot: "assistantMark",
  steps: ["8.2", "1.1"],
  level: "Intermediate",
  audienceType: "IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
