import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "datenschutzmanagement-software",
  messages: "dpms",
  art: "unternehmen",
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte und Geschäftsführung",
  citations: ["gdpr"],
});

export const generateMetadata = page.metadata;
export default page.Page;
