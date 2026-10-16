import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "mcp-fehlermeldungen",
  messages: "errors",
  art: "unternehmen",
  shot: "assistants",
  steps: ["2.2", "7.3"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
