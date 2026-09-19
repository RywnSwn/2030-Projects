import { WelcomeMap } from "@/components/home/WelcomeMap";
import { HowToRead } from "@/components/home/HowToRead";
import { GroupCards } from "@/components/home/GroupCards";
import { PlacesToGo } from "@/components/home/PlacesToGo";
import { ClosingBand } from "@/components/home/ClosingBand";
import { PageTransition } from "@/components/ui/PageTransition";

/**
 * The landing page. The map is the front door; everything under it explains
 * the map and then points at the rest of the site.
 *
 * The order is deliberate: see the grade split into colors, learn to read
 * those colors, meet the groups, then go somewhere else.
 */
export default function HomePage() {
  return (
    <PageTransition>
      <WelcomeMap />
      <HowToRead />
      <GroupCards />
      <PlacesToGo />
      <ClosingBand />
    </PageTransition>
  );
}
