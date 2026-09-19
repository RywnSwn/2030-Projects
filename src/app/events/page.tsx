import type { Metadata } from "next";
import { EventsClient } from "@/components/events/EventsClient";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <PageTransition>
      <EventsClient />
    </PageTransition>
  );
}
