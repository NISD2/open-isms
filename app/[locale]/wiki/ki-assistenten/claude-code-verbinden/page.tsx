import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "claude-code-verbinden",
  messages: "claudeCode",
  art: "2_2",
  shot: "assistants",
  steps: ["2.2", "5.1", "4.4"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
