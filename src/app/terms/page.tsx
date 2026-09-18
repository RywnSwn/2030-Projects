import type { Metadata } from "next";
import Link from "next/link";
import { gradeStats } from "@/lib/gradeStats";
import { LegalPage, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "The house rules for using this site.",
};

/** House rules. Short on purpose: a wall of legalese nobody reads protects nobody. */
export default function TermsPage() {
  return (
    <LegalPage
      title="House rules"
      lede="Short version: this is a site about real people you see every day. Treat it that way."
      updated="September 2026"
    >
      <Section heading="Who can use it">
        <p>
          The {gradeStats.peopleCount} people on the class of 2030 roster at ISY. Your account is yours.
          Do not let anyone else sign in as you, and do not sign in on a device you do not trust.
        </p>
      </Section>

      <Section heading="What not to put on here">
        <ul>
          <li>Anything about someone else that they have not agreed to have on here.</li>
          <li>Photos of other people without asking them first. Your profile photo should be you.</li>
          <li>Anything meant to hurt, humiliate, exclude or pile on somebody.</li>
          <li>Anything you would not be fine with every single person in the grade reading, because they can.</li>
        </ul>
      </Section>

      <Section heading="Do not take this off the site">
        <p>
          Screenshotting the map or someone&rsquo;s profile and putting it somewhere else, or sending it
          to people outside the grade, breaks the one promise this site makes. The whole reason it is
          behind a sign-in is that it stays inside the grade.
        </p>
      </Section>

      <Section heading="The map is not a scoreboard">
        <p>
          The colors came out of an algorithm, not out of anyone&rsquo;s opinion, and dot size is just how
          many people someone is connected to. It is not a popularity ranking, it is not a list of who
          matters, and using it as one is exactly the thing this site is not for.
        </p>
      </Section>

      <Section heading="Things can be taken down">
        <p>
          A bio, a photo or a post that breaks these rules can be removed, and an account can be cut off
          if someone keeps at it. That is a judgement call made by the person who runs the site, and it
          is not meant to be a courtroom.
        </p>
      </Section>

      <Section heading="No promises about uptime">
        <p>
          This is a student project built in spare time. It can break, go down, or lose something. Do not
          make it the only place anything important lives.
        </p>
      </Section>

      <Section heading="Related">
        <p>
          What the site stores about you is on the <Link href="/privacy/">privacy page</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
