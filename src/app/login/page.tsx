import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./LoginClient";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <PageTransition>
      {/* useSearchParams needs a Suspense boundary in a static export. */}
      <Suspense fallback={null}>
        <LoginClient />
      </Suspense>
    </PageTransition>
  );
}
