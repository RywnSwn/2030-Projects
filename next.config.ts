import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: every data source is client-SDK-only (Firebase), so SSR
  // adds nothing. `out/` deploys straight to Firebase Hosting.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
