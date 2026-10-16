import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "mcp-schluessel-oder-anmeldung",
  messages: "keyOrSignIn",
  art: "11_1",
  shot: "assistants",
  steps: ["11.1"],
  level: "Intermediate",
  audienceType: "IT-Verantwortliche und CISO",
  citations: ["nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
