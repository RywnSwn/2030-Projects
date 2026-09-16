import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/ui/SiteHeader";
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
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
