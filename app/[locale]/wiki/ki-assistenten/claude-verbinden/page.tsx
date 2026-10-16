import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "claude-verbinden",
  messages: "claude",
  art: "3_1",
  shot: "assistants",
  steps: ["2.2", "3.1"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche und Geschäftsführung",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
