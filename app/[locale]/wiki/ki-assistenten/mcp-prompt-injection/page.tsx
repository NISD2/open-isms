import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "mcp-prompt-injection",
  messages: "promptInjection",
  art: "5_2",
  shot: "assistantMark",
  steps: ["5.1", "5.2"],
  level: "Expert",
  audienceType: "CISO und IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
