import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "andere-assistenten-verbinden",
  messages: "otherAssistants",
  art: "11_2",
  shot: "assistants",
  steps: ["2.2"],
  level: "Intermediate",
  audienceType: "IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
