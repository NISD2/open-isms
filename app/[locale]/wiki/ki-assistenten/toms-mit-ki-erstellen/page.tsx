import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "toms-mit-ki-erstellen",
  messages: "gdprToms",
  art: "9_1",
  shot: "export",
  steps: ["9.1", "4.4", "4.2"],
  level: "Intermediate",
  audienceType: "Datenschutzbeauftragte und IT-Verantwortliche",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
