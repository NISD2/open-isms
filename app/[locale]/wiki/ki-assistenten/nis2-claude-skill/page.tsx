import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "nis2-claude-skill",
  messages: "claudeSkill",
  art: "2_1",
  shot: "assistants",
  steps: ["2.1", "2.2"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
