import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "mcp-sicherheit",
  messages: "security",
  art: "11_1",
  shot: "assistants",
  steps: ["11.1", "10.1"],
  level: "Expert",
  audienceType: "CISO und IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
