import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/schema.ts", "src/data.ts", "src/db/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ["zod", "drizzle-orm"],
});
