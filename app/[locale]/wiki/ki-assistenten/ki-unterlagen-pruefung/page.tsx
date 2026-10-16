import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "ki-unterlagen-pruefung",
  messages: "auditAiDocs",
  art: "7_3",
  shot: "activityLog",
  steps: ["7.3", "12.4"],
  level: "Intermediate",
  audienceType: "Geschäftsführung, Prüfer und CISO",
  citations: ["nis2", "bsig"],
});

export const generateMetadata = page.metadata;
export default page.Page;
