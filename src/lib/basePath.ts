/**
 * The URL prefix the site is served under. Empty locally, "/<repo>" on a
 * GitHub Pages project site (set by .github/workflows/deploy.yml at build time).
 * Next's <Link> adds it automatically; hand-built URLs must use `withBasePath`.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
