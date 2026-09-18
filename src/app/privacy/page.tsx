import type { Metadata } from "next";
import Link from "next/link";
import { gradeStats } from "@/lib/gradeStats";
import { VISIBLE_MIN_WEIGHT } from "@/lib/graphData";
import { LegalPage, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site stores about you, who can see it, and how to get it changed or removed.",
};

/**
 * Plain-language privacy notice. Readable without signing in (see PUBLIC_PATHS
 * in AuthGate), because someone deciding whether to sign in at all needs to be
 * able to read it first.
 *
 * Everything here is written against what the code actually does. If the
 * schema, the buckets or the auth flow change, this page changes with them.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      lede="This site holds real information about real students, so here is exactly what it keeps, who can see it, and how to get it changed or taken down. No lawyer wrote this. It is written to be understood."
      updated="September 2026"
    >
      <Section heading="Who this is for">
        <p>
          This is a private site for one grade at ISY, the class of {gradeStats.peopleCount} people it was
          built around. It is not a public website and it is not a school system. It is a student project,
          run by a student in that grade.
        </p>
      </Section>

      <Section heading="You have to sign in, and only the grade can get in">
        <p>
          Signing in uses Google. Your email address has to already be on the grade roster in this
          project, or you cannot get past the sign-in screen. There is no way to make an account, and
          there is no public version of any page except this one and the terms.
        </p>
      </Section>

      <Section heading="What is stored about you">
        <ul>
          <li>
            <strong>Your name and school email.</strong> These were put into the project when the map was
            built, so that the roster exists and so that signing in can match you to your own page.
          </li>
          <li>
            <strong>What Google tells us when you sign in.</strong> Your email address, and the display
            name and profile picture on your Google account. This is held by Supabase, which handles
            sign-in.
          </li>
          <li>
            <strong>Your bio and profile photo,</strong> if you write or upload one. Nothing is there
            until you put it there. Bios are capped at 280 characters.
          </li>
          <li>
            <strong>The friendship ratings</strong> everyone gave each other, from 0 to 5, which are what
            the map is drawn from.
          </li>
        </ul>
        <p>
          That is the whole list. No location, no browsing history, no messages, no device information,
          nothing from any other app or site.
        </p>
      </Section>

      <Section heading="Who can see what">
        <ul>
          <li>
            <strong>Anyone in the grade who is signed in</strong> can see the map, everyone&rsquo;s names,
            the friend groups, and any bio or profile photo people have added.
          </li>
          <li>
            <strong>Nobody can see the low ratings.</strong> Ratings below {VISIBLE_MIN_WEIGHT} are never
            drawn, never counted, never put in a tooltip, and never read out by a screen reader. That
            covers &ldquo;we don&rsquo;t know each other&rdquo; and anything worse.
          </li>
          <li>
            <strong>Profile photos are not public.</strong> They sit in a private store and are loaded
            through links that expire after an hour. Nobody can share a permanent image link to someone
            else&rsquo;s face.
          </li>
          <li>
            <strong>Only you can edit your own bio and photo.</strong> That is enforced by the database
            itself, not just by hiding a button.
          </li>
        </ul>
      </Section>

      <Section heading="The one thing the low ratings do affect">
        <p>
          Being straight about this: the low ratings are fed into the algorithm that sorts the grade into
          color groups. So a person&rsquo;s group color is shaped, very slightly, by ratings nobody can
          see. It is a whole-grade calculation over hundreds of numbers, so you cannot work backwards
          from someone&rsquo;s color to any single rating. But it is not literally zero, and it would be
          dishonest to claim otherwise.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          This site sets no cookies of its own. It does not use Google Analytics or anything like it,
          there is no advertising, and nothing here tracks you across other websites.
        </p>
        <p>
          When you sign in, your session is kept in your own browser&rsquo;s local storage so you do not
          have to sign in again on every page. Your browser also briefly remembers which page you were
          heading to. Both of those stay on your device and clear when you sign out or clear your
          browser data. Google sets its own cookies on Google&rsquo;s own sites while you sign in, which
          is between you and Google.
        </p>
        <p>
          Because none of that is tracking, there is no cookie banner. If analytics ever gets added to
          this site, a banner has to be added at the same time.
        </p>
      </Section>

      <Section heading="Search engines are blocked">
        <p>
          Every page tells search engines not to index it, and the site asks crawlers to stay out
          entirely. Searching your name should never turn this site up. That is the opposite of what
          most sites do, and it is on purpose.
        </p>
      </Section>

      <Section heading="Changing or removing your stuff">
        <ul>
          <li>
            Your bio and profile photo are yours to change or delete whenever you want, from your own
            profile page.
          </li>
          <li>
            Want your rating data, your row, or your whole account gone? Ask, and it gets removed. A
            self-serve delete-my-account button is still being built; until it exists, removal is done by
            hand, and you should not have to wait long for it.
          </li>
          <li>
            You do not have to give a reason for any of this, and asking is not a big deal.
          </li>
        </ul>
      </Section>

      <Section heading="Where it lives">
        <p>
          The pages are hosted on GitHub Pages. Accounts, profiles and photos are stored with Supabase.
          The code is open on GitHub, but the data is not in it: the roster and the friendship numbers
          are the project&rsquo;s own files, and everything people add later lives in Supabase behind
          sign-in.
        </p>
      </Section>

      <Section heading="Asking about any of this">
        {/* Deliberately no personal email printed here: this page is readable
            without signing in, so anything on it is public. */}
        <p>
          Ask the person who runs the site, in person at school. If something here is wrong, unclear, or
          makes you uncomfortable, that is worth saying, and it will get fixed.
        </p>
        <p>
          The house rules are on the <Link href="/terms/">terms page</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
