import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["better-auth", "apexcharts", "react-apexcharts"],
  turbopack: {
    resolveAlias: {
      "better-auth/client/plugins":
        "./node_modules/better-auth/dist/client/plugins/index.mjs",
      "better-auth/react":
        "./node_modules/better-auth/dist/client/react/index.mjs",
      "apexcharts/client": "./node_modules/apexcharts/dist/apexcharts.esm.js",
    },
  },
};

export default nextConfig;
