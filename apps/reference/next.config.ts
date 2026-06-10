import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@nisd2/isms-pages",
    "@nisd2/isms-ui",
    "@nisd2/grc-data-model",
  ],
  // pg ships native bindings via node-gyp. Keep it out of the bundle so
  // the runtime can require() it from node_modules.
  serverExternalPackages: ["pg", "@auth/drizzle-adapter"],
};

export default nextConfig;
