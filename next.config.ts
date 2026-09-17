import type { NextConfig } from "next";

// GitHub Pages serves a project site under /<repo-name>/. The deploy workflow
// sets NEXT_PUBLIC_BASE_PATH to that prefix; locally it is empty. Anything
// that builds a URL by hand (not <Link>/<Image>) must go through
// `withBasePath()` in src/lib/basePath.ts.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static export: every data source is client-SDK-only (Supabase), so SSR
  // adds nothing. `out/` deploys straight to GitHub Pages.
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
