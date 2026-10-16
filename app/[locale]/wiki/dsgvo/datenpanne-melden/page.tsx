import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "datenpanne-melden",
  messages: "breach",
  art: "3_3",
  shot: "path",
  steps: ["3.1", "3.3"],
  level: "Beginner",
  audienceType: "Geschäftsführung, Datenschutzbeauftragte und IT-Verantwortliche",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
