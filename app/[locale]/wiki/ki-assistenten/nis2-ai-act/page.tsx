import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "nis2-ai-act",
  messages: "aiActNis2",
  art: "1_1",
  shot: "approved",
  steps: ["1.1", "7.3"],
  level: "Intermediate",
  audienceType: "Geschäftsführung, Rechtsabteilung und CISO",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
