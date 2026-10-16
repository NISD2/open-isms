import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "auskunftsersuchen-dsgvo",
  messages: "access",
  art: "unternehmen",
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte und Geschäftsführung",
  citations: ["gdpr"],
});

export const generateMetadata = page.metadata;
export default page.Page;
