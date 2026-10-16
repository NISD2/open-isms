import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "was-der-assistent-ausfuellt",
  messages: "whatItFills",
  art: "2_2",
  shot: "assistantMark",
  steps: ["2.2", "5.2", "4.4", "11.1"],
  level: "Beginner",
  audienceType: "IT-Verantwortliche und CISO",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
