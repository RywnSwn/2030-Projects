import type { Metadata } from "next";
import { AnnouncementsClient } from "@/components/announcements/AnnouncementsClient";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata: Metadata = { title: "Announcements" };

export default function AnnouncementsPage() {
  return (
    <PageTransition>
      <AnnouncementsClient />
    </PageTransition>
  );
}
