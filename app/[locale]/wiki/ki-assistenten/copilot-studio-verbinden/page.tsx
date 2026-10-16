import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "copilot-studio-verbinden",
  messages: "copilotStudio",
  art: "10_1",
  shot: "assistants",
  steps: ["5.1", "10.1"],
  level: "Intermediate",
  audienceType: "IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
