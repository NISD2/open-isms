import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "datenschutzbeauftragter-pflicht",
  messages: "dpo",
  art: "1_1",
  level: "Beginner",
  audienceType: "Geschäftsführung und Datenschutzbeauftragte",
  citations: ["gdpr"],
});

export const generateMetadata = page.metadata;
export default page.Page;
