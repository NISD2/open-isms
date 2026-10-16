import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "dsgvo-mit-ki-assistent",
  messages: "gdprMcp",
  art: "3_1",
  shot: "assetList",
  steps: ["2.2", "5.1", "3.1"],
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte, Geschäftsführung und IT-Verantwortliche",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
