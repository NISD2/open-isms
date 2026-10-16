import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "ki-verantwortung-geschaeftsleitung",
  messages: "accountability",
  art: "7_3",
  shot: "approved",
  steps: ["7.3", "1.1"],
  level: "Intermediate",
  audienceType: "Geschäftsführung und Rechtsabteilung",
  citations: ["nis2", "bsig", "cir-2024-2690"],
});

export const generateMetadata = page.metadata;
export default page.Page;
