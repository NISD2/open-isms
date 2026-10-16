import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "auftragsverarbeitungsvertrag",
  messages: "dpa",
  art: "5_2",
  shot: "path",
  steps: ["5.1", "5.2"],
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte, Einkauf und Geschäftsführung",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
