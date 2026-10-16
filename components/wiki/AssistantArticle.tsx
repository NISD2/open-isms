import { type ArticleCategory, type ArticlePage, articlePage } from "./WikiArticle";

/**
 * The AI assistants category: connecting an assistant to the NIS 2 walkthrough through MCP. Its
 * pages end on the walkthrough's price, since the walkthrough is what they describe.
 */
const AI_ASSISTANTS: ArticleCategory = {
  topLevel: "ki-assistenten",
  namespace: "aiAssistants",
  about: ["nis2"],
  closing: "price",
};

export const assistantPage = (page: ArticlePage) => articlePage(AI_ASSISTANTS, page);
