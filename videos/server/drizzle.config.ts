import { defineConfig } from "drizzle-kit";

const url = process.env.PIPELINE_DATABASE_URL;
if (!url) throw new Error("PIPELINE_DATABASE_URL is required");

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
