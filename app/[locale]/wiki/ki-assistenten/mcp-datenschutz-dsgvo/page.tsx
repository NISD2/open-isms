import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "mcp-datenschutz-dsgvo",
  messages: "dataProtection",
  art: "9_1",
  shot: "assistants",
  steps: ["5.1", "9.1"],
  level: "Intermediate",
  audienceType: "Datenschutzbeauftragte, CISO und Rechtsabteilung",
  citations: ["nis2", "gdpr"],
});

export const generateMetadata = page.metadata;
export default page.Page;
