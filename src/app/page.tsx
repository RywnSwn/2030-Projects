import { WelcomeMap } from "@/components/home/WelcomeMap";
import { HowToRead } from "@/components/home/HowToRead";
import { GroupCards } from "@/components/home/GroupCards";
import { ThreadsBetween } from "@/components/home/ThreadsBetween";
import { FaceWall } from "@/components/home/FaceWall";
import { ClosingBand } from "@/components/home/ClosingBand";

/**
 * The landing page. The map is the front door; everything under it is the
 * argument the map alone can't make.
 *
 * The order is deliberate: see the grade split into colors, learn to read
 * those colors, meet the groups, then find out the groups barely hold.
 */
export default function HomePage() {
  return (
    <>
      <WelcomeMap />
      <HowToRead />
      <GroupCards />
      <ThreadsBetween />
      <FaceWall />
      <ClosingBand />
    </>
  );
}
