import type { Metadata } from "next";
import { PeopleListFallback } from "@/components/a11y/PeopleListFallback";

export const metadata: Metadata = { title: "People" };

export default function PeoplePage() {
  return <PeopleListFallback />;
}
