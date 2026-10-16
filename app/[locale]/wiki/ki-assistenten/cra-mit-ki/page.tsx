import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "cra-mit-ki",
  messages: "cra",
  art: "6_3",
  shot: "path",
  steps: ["6.3", "5.2"],
  level: "Intermediate",
  audienceType: "CISO und IT-Verantwortliche bei Herstellern",
  citations: ["cra", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
