import type { Metadata } from "next";
import { PeopleListFallback } from "@/components/a11y/PeopleListFallback";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata: Metadata = { title: "People" };

export default function PeoplePage() {
  return (
    <PageTransition>
      <PeopleListFallback />
    </PageTransition>
  );
}
