import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "ki-eintraege-nachvollziehen",
  messages: "traceEntries",
  art: "7_3",
  shot: "activityLog",
  steps: ["7.3"],
  level: "Beginner",
  audienceType: "Geschäftsführung, Prüfer und CISO",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
