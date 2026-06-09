import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/enums.ts",
    "src/schema/index.ts",
    "src/frameworks/index.ts",
    "src/satisfaction-pairs.ts",
    "src/mappings/nis2-gdpr.ts",
    "src/seed.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ["drizzle-orm"],
});
