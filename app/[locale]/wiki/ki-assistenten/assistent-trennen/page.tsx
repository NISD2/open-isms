import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "assistent-trennen",
  messages: "disconnect",
  art: "10_1",
  shot: "assistants",
  steps: ["10.1"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche und CISO",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
