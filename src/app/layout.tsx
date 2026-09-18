import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { AuthGate } from "@/components/auth/AuthGate";
import { AuthProvider } from "@/lib/auth";
import { designTokens } from "@/lib/designTokens";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: {
    default: "Class of 2030",
    template: "%s | Class of 2030",
  },
  description: "A private friend map for one grade at ISY.",
  // Real people's data lives here. Never let search engines index any page.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  themeColor: designTokens.bg,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <AuthProvider>
          {/* First thing in the tab order: lets a keyboard user jump the nav
              instead of tabbing through it on every page. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:text-bg"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 flex flex-col">
            <AuthGate>{children}</AuthGate>
          </main>
          {/* Outside AuthGate on purpose: the privacy page has to be reachable
              from the sign-in screen and the gated state, not just from inside. */}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
