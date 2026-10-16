import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "iso-27001-mcp-server",
  messages: "iso27001",
  art: "2_3",
  shot: "riskMap",
  steps: ["2.2", "2.3", "7.3"],
  level: "Intermediate",
  audienceType: "CISO und IT-Verantwortliche",
  citations: ["nis2", "cir-2024-2690"],
});

export const generateMetadata = page.metadata;
export default page.Page;
