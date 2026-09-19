import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Nothing here.</h1>
        <p className="mt-2 text-ink-muted">That page does not exist.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-4 py-2 font-display text-bg">
          Back to the map
        </Link>
      </div>
    </PageTransition>
  );
}
