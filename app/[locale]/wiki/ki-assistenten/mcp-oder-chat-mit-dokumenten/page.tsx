import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "mcp-oder-chat-mit-dokumenten",
  messages: "mcpVsChat",
  art: "2_4",
  shot: "activityLog",
  steps: ["2.2", "2.4"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche und Geschäftsführung",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
