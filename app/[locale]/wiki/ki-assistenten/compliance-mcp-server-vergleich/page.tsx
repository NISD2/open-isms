import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "compliance-mcp-server-vergleich",
  messages: "grcMcpComparison",
  art: "2_4",
  shot: "assistantMark",
  steps: ["2.2", "7.3"],
  level: "Intermediate",
  audienceType: "CISO, IT-Verantwortliche und Geschäftsführung",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
