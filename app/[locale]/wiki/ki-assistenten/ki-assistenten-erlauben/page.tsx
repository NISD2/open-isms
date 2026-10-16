import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "ki-assistenten-erlauben",
  messages: "allowAssistants",
  art: "unternehmen",
  shot: "assistants",
  steps: ["2.2", "5.1"],
  level: "Beginner",
  audienceType: "Admins und IT-Verantwortliche",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
