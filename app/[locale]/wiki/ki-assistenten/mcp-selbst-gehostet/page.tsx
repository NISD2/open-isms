import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "mcp-selbst-gehostet",
  messages: "selfHosted",
  art: "unternehmen",
  shot: "assistants",
  steps: ["2.2", "4.4"],
  level: "Expert",
  audienceType: "IT-Verantwortliche und CISO",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
