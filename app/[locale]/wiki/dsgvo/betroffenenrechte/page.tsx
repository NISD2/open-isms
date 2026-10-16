import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "betroffenenrechte",
  messages: "rights",
  art: "unternehmen",
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte und Geschäftsführung",
  citations: ["gdpr"],
});

export const generateMetadata = page.metadata;
export default page.Page;
