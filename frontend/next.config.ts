import type { NextConfig } from "next";

const nestApiFromEnv =
  process.env.API_URL !== undefined && process.env.API_URL !== ""
    ? process.env.API_URL
    : process.env.NEXT_PUBLIC_API_URL;
const nestApiBase =
  nestApiFromEnv !== undefined && nestApiFromEnv !== ""
    ? nestApiFromEnv
    : "http://localhost:3001/api";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/elovate-api/:path*",
        destination: `${nestApiBase}/:path*`,
      },
    ];
  },
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
