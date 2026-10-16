import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "nis2-mcp-server",
  messages: "mcpServer",
  art: "unternehmen",
  shot: "assistantMark",
  steps: ["2.2", "5.1", "7.3"],
  level: "Beginner",
  audienceType: "Geschäftsführung und IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
