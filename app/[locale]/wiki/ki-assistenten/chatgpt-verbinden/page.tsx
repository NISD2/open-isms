import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "chatgpt-verbinden",
  messages: "chatgpt",
  art: "unternehmen",
  shot: "assistants",
  steps: ["2.2", "5.1"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche und Geschäftsführung",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
