import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "dsgvo-konform",
  messages: "compliant",
  art: "7_3",
  level: "Beginner",
  audienceType: "Geschäftsführung und Datenschutzbeauftragte",
  citations: ["gdpr"],
});

export const generateMetadata = page.metadata;
export default page.Page;
