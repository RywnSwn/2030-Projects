# Grade Friend-Graph Site — Build Plan

## Context

This is a personal project by a rising 9th grader at ISY (Myanmar) for their 39-person grade. The centerpiece is a landing page that runs Louvain community detection over a real (self-collected) friendship dataset for the grade and renders it as an interactive, semi-3D friend map, colored by detected friend group. Beyond the landing page, the site grows into a small private hub for the grade: profile customization, a homework tracker, a private GPA tracker, an events page, and an empty-to-start "lore" wall.

This plan was produced across a long planning-only conversation (no code written yet) that worked out the concept, visual direction, interaction model, legal/privacy posture, and tech stack through back-and-forth and design research. **The actual build will happen in separate future coding sessions/chats that have no memory of that conversation** (the student has limited AI usage credits and wants to build "one phase at a time"). This document is written to stand alone as the full handoff — a future session should be able to execute Phase 0 through Phase 10 below using only this file.

The repo (`/home/user/2030-Projects`) is currently a **100% blank slate**: empty git repo, no commits, no package.json, no framework, no data files. Nothing to build on top of. The Louvain "calculator" prototype the student mentioned building (screenshot: dark background, glowing green nodes, force-directed layout) exists outside this repo and was never committed here — it should be treated as informal proof-of-concept only, not code to reuse.

**Important constraint carried through every phase**: weight-0 ("Hate") and weight-1 ("Don't know each other") edges must feed the Louvain math (they affect which cluster someone lands in) but must **never** be visible anywhere in the UI — no label, no tooltip, no ARIA text, no count that could let someone infer their existence. See "Privacy-preserving graph math" below for the concrete rule this becomes in code.

---

## Locked design decisions (do not relitigate these)

**Landing page graph**
- Louvain community detection on the full weighted graph (39 people, 741 pairwise connections, weights 0–5).
- Visual style: **semi-3D**, not flat-2D-only and not a full walkable 3D "world" (no floors, no walking, no rooms/environment). Real depth, lighting, and a camera that orbits/zooms with limited tilt.
- Background: warm off-white, not pure white (pure white washes out pastels).
- Nodes: **dots only**, no translucent "blob" regions behind clusters (decided against blobs for simplicity and performance).
- Node color = detected community (one pastel hue per cluster). Node size = number/strength of connections (weight ≥ 2 only, see privacy rule). Edge thickness = connection weight. Edges are curved, not straight.
- Depth fog so distant nodes fade slightly pale — this is the light-mode equivalent of the neon-glow trick dark sites use, and is how "3D" reads on a white background.
- Soft drop shadows under nodes for depth.
- Slow idle camera drift so the scene never looks frozen; pauses on interaction, resumes after ~8s idle.
- Names visible by default (not hover-only).
- Interaction: hover/select a person → their direct connections stay full opacity, everyone else dims to **~40%** (not a hard fade to near-invisible — this was explicitly chosen as softer than a typical "ego network" implementation). This is the "ego highlight" UX pattern; research shows it cuts time-to-find-a-neighbor from 100+ seconds to ~10–20.
- Mobile: automatically falls back to a **flat 2D** version of the same graph on small screens (3D orbit controls are fiddly on touch/low-end phones). This is a prop swap, not a second implementation, if using reagraph (see Tech Stack).

**Explicitly rejected, do not reintroduce**
- Full walkable 3D environment (a la Bruno Simon's driving portfolio) — too "super 3D," and that specific gimmick is considered overused/derivative.
- Dark, neon-glow, cinematic aesthetic (a la Lusion) — wrong emotional register for this project; not "hackery," not "scary."
- A VR-nostalgia-horror theme the student floated early on — dropped once "white, friendly, not scary" was locked in. Do not add horror/unsettling elements anywhere.
- SEO optimization — inverted on purpose, see Legal/Privacy below: this site must be **blocked** from search indexing, not optimized for it.
- Cookie consent banner — not needed unless analytics/tracking cookies are added later (only strictly-necessary auth session cookies are planned).
- Translucent blob regions behind clusters — considered, decided against in favor of dots-only.

**Visual/design system**
- Fonts (Google Fonts, free): **Bricolage Grotesque** for headlines, **Fraunces** for body/display text. Chosen over Inter-everywhere defaults specifically to avoid the generic-AI-site look.
- Color: warm off-white base, one near-black ink for text, 5–7 pastel hues (neo-mint, lavender, blush, butter yellow, soft sky, etc.) assigned one per detected community by descending cluster size. Accent/button color = whichever pastel passes the best contrast ratio against ink (WCAG AA: ≥4.5:1 text, ≥3:1 large UI).
- Icons: **Lucide** (or Phosphor) icon library — never hand-drawn/generic AI-style SVG icons.
- Real photos from the actual grade should be used for decorative content (events, etc.) wherever possible, not stock photography or generic illustrations. Profile pictures are user-uploaded (no sourcing needed, that's on each person via login).
- Motion: springy easing throughout, subtle cursor parallax on the graph, slow idle drift, nothing snaps abruptly. (Borrowed from studios like Lusion for craft quality only — not their dark aesthetic.)

**Style references gathered during planning** (for whoever builds the visual polish):
- Anthropic's "Scaling Monosemanticity" interactive UMAP (Adam Pearce) — zoom-into-clusters interaction model.
- Distill.pub "Activation Atlas" — organizing many items into a 2D map by similarity/clusters.
- Obsidian's graph view — graph as the literal functional centerpiece of a product, not decoration.
- 14islands' "Blob Mixer" — reference for soft/matte 3D material style, in case blobs get reconsidered later.
- Neutral Studio's "Warm & Fuzzy" — playful 3D, bold type, contrasting colors, restrained (the target register).

**Auth & accounts**
- Google OAuth only, via Firebase Auth, kept in **Testing** mode (add each of the 39 people's real emails as OAuth test users) — this skips Google's app-verification review since it's under 100 users. Test-user tokens expire after 7 days (re-auth needed); testing mode shows an "unverified app" click-through warning. Both are fine for a 39-person friend project, worth telling the group up front.
- Click any dot → view that profile (pfp, bio, a small "ego" mini-graph of just their direct weight≥2 connections). Only the profile owner can edit their own pfp/bio.

**Other pages**
- **Homework tracker**: **private per student** (decided — each person's homework list is visible only to them, matching how GPA works).
- **GPA tracker**: private, owner-only, enforced at the database level (not just hidden in UI). This is the most privacy-sensitive data on the site.
- **Events**: shared/visible to the whole grade. Any authenticated person can create an event; only the creator (or an admin flag) can edit/delete it.
- **Lore**: starts empty (a friendly empty state, not an error state), fills in over time as a shared wall any logged-in person can post text/images to.

**Legal & privacy requirements**
- Real **delete-my-account** feature: must actually delete the user's Firestore docs and Storage files (not soft-delete/hide), then delete the Firebase Auth user record. Requires re-auth (Firebase requirement for destructive auth actions) and a confirmation modal (irreversible).
- Firestore security rules enforce: GPA readable/writable only by its owner; homework readable/writable only by its owner; profile edits only by the profile's owner; general profile/graph data readable by any authenticated grade member, never by the public internet.
- Plain-language privacy notice page (no login required to read it): what's collected (name, Google profile info, self-written bio, connection weights, homework/GPA entries) and who can see what.
- Site must be **blocked from search engine indexing**: `robots.txt` disallow-all + `noindex` meta on every page. This is the opposite of normal SEO and exists because real minors' personal data lives on this site — call this out as its own explicit task so it never gets skipped.
- No cookie consent banner needed as long as no analytics/tracking cookies are added. If Google Analytics or similar gets added later, a consent banner becomes necessary at that point — leave a note in the privacy page saying so.

**Accessibility requirements**
- Alt text on every image (profile photos, event images, lore images).
- Color contrast checked for pastel-on-warm-white (WCAG AA minimum) — automated check (axe/Lighthouse) against every pastel/ink combination actually used.
- A keyboard-accessible way to browse people that doesn't require operating the 3D/2D graph with a mouse: a simple searchable/alphabetical list page (`/people`), fully tab/Enter operable.
- Screen reader labels for the graph must never leak hidden (weight 0/1) connection data — see the privacy-preserving graph math rule below for the concrete fix.

**Privacy-preserving graph math (concrete rule, applies everywhere in the app)**
Every user-observable output — node size, hover tooltip text, ARIA label, ego mini-graph, connection counts — is computed **only from edges with weight ≥ 2**. Weight 0/1 edges are loaded into the Louvain input graph (they affect clustering) and nowhere else — never rendered, never counted, never spoken by a screen reader. The only trace of hidden edges anywhere in the UI is a person's community color, which is a whole-graph aggregate that doesn't let anyone reverse-engineer a single hidden edge — that residual is acceptable and should be documented as such in the privacy notice. If someone's hidden edges make them a singleton community, don't add any special "isolated" UI for it — render it like any other single-color cluster.

---

## Tech stack

- **Frontend**: Next.js, App Router, TypeScript, **static export mode** (`output: 'export'` in `next.config.mjs`) — not SSR. Every data source (Firebase Auth/Firestore/Storage) is client-SDK-only, so SSR adds complexity (hydration mismatches, `window is not defined` from WebGL during prerender) for zero benefit. Static export deploys straight to Firebase Hosting free tier. Any component touching the graph/WebGL must be `'use client'`, dynamically imported with `{ ssr: false }`. If Next.js's client/server split proves confusing in practice, plain Vite + React + react-router is a valid fallback (pure SPA, fewer footguns) — but proceed with Next.js first since it has more beginner tutorials.
- **Backend/data**: Firebase — Auth (Google provider only), Firestore, Storage, Hosting. (Chosen over Supabase earlier: easier Google OAuth integration, live Firestore updates, more beginner tutorials.)
- **Graph rendering**: **reagraph** (`reagraph` on npm, github.com/reaviz/reagraph). Validated against every requirement:
  - Custom node images (profile photos in nodes): via the `renderNode` prop (react-three-fiber JSX) + `@react-three/drei` texture loading, with a canvas-generated initials fallback when no photo is set.
  - 2D/3D switching: built-in `layoutType` prop (`forceDirected2d` / `forceDirected3d`) — the mobile fallback is a prop swap.
  - Light theme: `theme` prop accepts a full theme object extending a light base.
  - Ego-hover-dim: `theme.node.inactiveOpacity` / `theme.edge.inactiveOpacity` (set to `0.4`) combined with the `useSelection` hook's hover-driven highlighting — this is exactly the "dim to ~40%, don't hide" behavior, built in.
  - Depth fog: `theme.canvas.fog`, native support.
  - **Gap (not built in)**: idle camera drift. Build this manually — grab reagraph's camera controls ref and drive a slow `requestAnimationFrame` auto-orbit, pausing on `pointerdown`/`wheel`, resuming after ~8s idle. Small custom hook (`useIdleDrift.ts`), not a library feature.
  - Practical note: pin an exact `reagraph` version in `package.json`, and at the start of the 3D-scene phase do a 15-minute spike confirming `theme.canvas.fog`, `node.inactiveOpacity`, and `renderNode`+texture all behave as documented in that pinned version before building on top (smaller-team library, docs can drift from a given release).
- **Community detection**: **precompute once via a committed Node script, commit the output as static JSON** — do not run Louvain live in the browser. Reason: Louvain is not fully deterministic (depends on node visitation order), so live recompute risks someone's cluster/color changing between page loads, which is worse for a social product than a manual recompute step when the source data changes. Package: `graphology` + `graphology-communities-louvain` (npm), which supports weighted graphs via a `getEdgeWeight` option — exactly matches the 0–5 weight model. Run via `scripts/compute-communities.mjs`, a devDependency-only script, never imported from `/src` (keeps Louvain code out of the client bundle).
- **Other packages**: `firebase` (client SDK v10+), `react-hook-form` + `@hookform/resolvers` + `zod` (forms/validation), `lucide-react` (icons), `date-fns` (due-date formatting), `clsx`, `firebase-tools` (devDependency, deploy/rules/emulator CLI).

---

## Data model

**Static data (repo, not Firestore)** — the 39-person roster and 741-edge connection graph are committed files, not database documents. This avoids 741 Firestore reads just to draw the graph and keeps the roster in version control.

- `data/people.json`: `[{ id, name, email, gradYear }]`. `id` is a stable slug (e.g. `"ethan-chen-aung"`), not a Firebase UID (UID doesn't exist until first login). `email` is the join key used to claim a profile on first login. **The full real roster (39 names) and connection list (741 pairs with weight 0–5) is provided verbatim in the Data Appendix at the end of this document** — transcribe it into `people.json`/`connections.json` in Phase 0. Note "You" (entry 39) is the student building this site — map that id to their own email.
- `data/connections.json`: `[{ a: personId, b: personId, weight: 0-5, label: string }]`. All 741 pairs, **including weight 0/1 rows** — the privacy rule is a render-time filter, not a storage-time omission, so nothing is dropped here.
- `data/communities.json`: generated by `scripts/compute-communities.mjs` — `{ [personId]: communityIndex }` plus `communityMeta: [{ index, size, colorHex }]` with a deterministic pastel assigned per community by descending size.

**Firestore collections** (only the data that actually changes at runtime):

`people/{personId}` (same id as the static roster — the "live" half of each person; seeded once in Phase 0/4, never created by clients):
```
{ email, ownerUid: string|null, photoURL: string|null, bio: string (≤280 chars),
  isAdmin: boolean (default false), updatedAt: Timestamp }
```

`homework/{itemId}` — private per student:
```
{ ownerUid, subject, title, dueDate: Timestamp, notes, completed: boolean, createdAt, updatedAt }
```

`gpaEntries/{entryId}` — private, privacy-critical:
```
{ ownerUid, subject, term, credits: number, gradeLetter: string, gradePoints: number, createdAt, updatedAt }
```
Overall GPA is computed client-side on read from raw entries — never cached/stored as an aggregate.

`events/{eventId}` — shared, grade-wide:
```
{ title, description, startAt: Timestamp, endAt: Timestamp|null, location,
  imageURL: string|null, imageAlt: string, createdByUid, createdAt }
```

`lorePosts/{postId}` — shared wall:
```
{ authorUid, authorPersonId, text, imageURL: string|null, imageAlt: string, createdAt }
```
Optional subcollection `lorePosts/{postId}/reactions/{uid} = { emoji }` — stretch item, not required for MVP.

**Firestore security rules** (`firestore.rules`, commit and deploy incrementally per phase, not all at once at the end):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isMember() { return request.auth != null; }

    match /people/{personId} {
      allow read: if isMember();
      allow create, delete: if false; // roster seeded out-of-band only
      allow update: if isMember() && (
        (resource.data.ownerUid == null
          && request.auth.token.email == resource.data.email
          && request.resource.data.ownerUid == request.auth.uid)
        ||
        (resource.data.ownerUid == request.auth.uid
          && request.resource.data.ownerUid == request.auth.uid
          && request.resource.data.email == resource.data.email)
      );
    }

    match /homework/{itemId} {
      allow read, update, delete: if isMember() && resource.data.ownerUid == request.auth.uid;
      allow create: if isMember() && request.resource.data.ownerUid == request.auth.uid;
    }

    match /gpaEntries/{entryId} {
      allow read, update, delete: if isMember() && resource.data.ownerUid == request.auth.uid;
      allow create: if isMember() && request.resource.data.ownerUid == request.auth.uid;
    }

    match /events/{eventId} {
      allow read: if isMember();
      allow create: if isMember() && request.resource.data.createdByUid == request.auth.uid;
      allow update, delete: if isMember() && resource.data.createdByUid == request.auth.uid;
      // admin-delete-anything escape hatch: add in a later refinement pass once an
      // efficient uid->isAdmin lookup (denormalized doc) exists; skip for v1 rules.
    }

    match /lorePosts/{postId} {
      allow read: if isMember();
      allow create: if isMember() && request.resource.data.authorUid == request.auth.uid;
      allow update, delete: if isMember() && resource.data.authorUid == request.auth.uid;
      match /reactions/{uid} {
        allow read: if isMember();
        allow write: if isMember() && uid == request.auth.uid;
      }
    }
  }
}
```

**Storage rules** (`storage.rules`):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{personId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && firestore.get(/databases/(default)/documents/people/$(personId)).data.ownerUid == request.auth.uid
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /events/{eventId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 8 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    match /lore/{postId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 8 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## Project structure

```
/home/user/2030-Projects
  package.json
  next.config.mjs              # output: 'export', images: { unoptimized: true }
  tailwind.config.ts
  tsconfig.json
  firebase.json                 # hosting: { public: "out", ... }
  .firebaserc
  firestore.rules
  firestore.indexes.json
  storage.rules
  data/
    people.json
    connections.json
    communities.json            # generated, committed
  scripts/
    compute-communities.mjs     # graphology + graphology-communities-louvain
    validate-data.mjs           # sanity check: 39 nodes, 741 edges, weights in [0,5]
  public/
    robots.txt                  # User-agent: * / Disallow: /
    favicon.ico
  src/
    app/
      layout.tsx                 # fonts (next/font/google), AuthProvider, metadata.robots noindex
      page.tsx                   # landing = graph page
      globals.css
      login/page.tsx
      people/page.tsx             # keyboard-accessible alphabetical/searchable fallback list
      profile/[personId]/page.tsx # view (+ edit if owner)
      homework/page.tsx
      gpa/page.tsx
      events/page.tsx
      lore/page.tsx
      privacy/page.tsx
      settings/page.tsx           # delete-my-account flow lives here
    components/
      graph/
        GraphSceneClient.tsx      # dynamic(() => import(...), { ssr:false }) boundary + breakpoint switch
        GraphScene3D.tsx
        GraphScene2D.tsx           # mobile/small-screen fallback (reagraph forceDirected2d)
        PersonNode.tsx             # renderNode: textured photo or initials fallback
        useIdleDrift.ts            # custom camera auto-orbit hook
        useEgoHighlight.ts         # wraps reagraph useSelection, sets inactiveOpacity=0.4
      profile/
        ProfileCard.tsx
        ProfileEditForm.tsx
        EgoMiniGraph.tsx           # small static reagraph instance, direct weight≥2 connections only
      homework/HomeworkList.tsx, HomeworkForm.tsx
      gpa/GpaTable.tsx, GpaForm.tsx, gpaCalc.ts
      events/EventList.tsx, EventForm.tsx
      lore/LoreWall.tsx, LorePostForm.tsx
      a11y/PeopleListFallback.tsx
      ui/ (Button, Input, Modal, IconButton — Lucide-based primitives)
    lib/
      firebase.ts                 # client SDK init (env vars)
      auth.tsx                    # AuthProvider, useAuth(), claimPersonRecord()
      graphData.ts                 # loads data/*.json, joins with live `people` docs
      louvainColors.ts             # deterministic pastel palette + WCAG contrast picker
      deleteAccount.ts             # batched cross-collection + Storage delete
      types.ts
    styles/
      tokens.css                   # CSS variables: --color-bg, --color-ink, --color-pastel-1..7
  README.md
```

Design tokens: keep actual hex values in `src/lib/designTokens.ts` (`{ bg, ink, pastels: string[] }`) as the single source of truth — generate `tokens.css` variables from it, wire it into `tailwind.config.ts`, and import the same constants directly into `louvainColors.ts` / the reagraph theme object (which needs plain hex strings, not CSS vars) to avoid drift between Tailwind and the WebGL scene.

---

## Staged build roadmap

Each phase is scoped to roughly one focused coding session and should be independently demoable before moving to the next. Security rules are written incrementally alongside each collection's introduction, not deferred to one big rules pass at the end — the app should never be left insecure between sessions.

**Phase 0 — Scaffolding + data**
Build: `create-next-app` (TS, App Router, Tailwind, ESLint); Firebase project created in console (Auth Google provider enabled, OAuth consent screen set to Testing, Firestore in production mode, Storage, Hosting); design tokens wired (`designTokens.ts`, `tokens.css`, `tailwind.config.ts`, fonts via `next/font/google`); `data/people.json` + `data/connections.json` populated by transcribing the Data Appendix below; `scripts/validate-data.mjs` confirms exactly 39 unique ids and 741 rows with weights in [0,5].
Key files: `next.config.mjs`, `tailwind.config.ts`, `src/lib/designTokens.ts`, `data/people.json`, `data/connections.json`, `scripts/validate-data.mjs`.
Verify: `npm run dev` shows a blank styled page using the right fonts/colors; `node scripts/validate-data.mjs` exits 0.

**Phase 1 — Louvain + flat graph render (no auth, no 3D)**
Build: `scripts/compute-communities.mjs` (graphology + `graphology-communities-louvain`, `getEdgeWeight: 'weight'` over all 741 edges including 0/1) writes `data/communities.json`; `src/lib/graphData.ts` joins people+connections+communities into a reagraph `{nodes, edges}` shape; `GraphScene2D.tsx` renders with `layoutType="forceDirected2d"`, node color = community pastel, node size = degree from weight≥2 edges only, edge thickness = weight (0/1 edges filtered from rendering entirely, per the privacy rule).
Key files: `scripts/compute-communities.mjs`, `data/communities.json`, `src/lib/graphData.ts`, `src/components/graph/GraphScene2D.tsx`, `src/app/page.tsx`.
Verify: land on `/`, see all 39 names in a flat graph with correct cluster colors; spot-check that rendered edge count for a couple of people matches their weight≥2 count, not their total connection count.

**Phase 2 — Semi-3D scene (desktop)**
Build: `GraphScene3D.tsx` using `layoutType="forceDirected3d"`; `theme.canvas.fog` + warm background; curved edges; soft drop shadows; `PersonNode.tsx` custom `renderNode` (initials-fallback texture only — photo wiring comes in Phase 5); camera controls constrained to limited tilt; `useIdleDrift.ts` custom auto-orbit hook, pausing on interaction and resuming after ~8s.
Key files: `src/components/graph/GraphScene3D.tsx`, `src/components/graph/PersonNode.tsx`, `src/components/graph/useIdleDrift.ts`.
Verify: graph has visible depth/lighting/fog, drifts slowly when idle, stops on drag, resumes after ~8s.

**Phase 3 — Interaction polish + mobile fallback**
Build: `useEgoHighlight.ts` wraps reagraph `useSelection` with `inactiveOpacity = 0.4` on both node and edge theme, hover-only (not click-lock) highlighting; `GraphSceneClient.tsx` breakpoint switch (small screens → `GraphScene2D`, else `GraphScene3D`), both dynamically imported with `ssr:false`; `src/app/people/page.tsx` keyboard-navigable alphabetical/searchable list as the accessible non-graph path, linking to `/profile/[personId]` (stub page for now, built out Phase 5).
Key files: `src/components/graph/useEgoHighlight.ts`, `src/components/graph/GraphSceneClient.tsx`, `src/app/people/page.tsx`.
Verify: hovering a name dims everyone else to ~40% while direct connections stay full opacity; resizing below the mobile breakpoint swaps to the flat 2D scene; `/people` is fully operable via Tab/Enter, no mouse.

**Phase 4 — Firebase Auth (Google OAuth) + account claiming**
Build: `src/lib/firebase.ts` client init; `src/lib/auth.tsx` `AuthProvider`/`useAuth()`; `login/page.tsx` Google sign-in button; `claimPersonRecord()` matches `auth.token.email` to a `people` doc and sets `ownerUid` per the rule above; route-level login gate on every page except `/privacy`; `firestore.rules` for `people` committed and deployed (`firebase deploy --only firestore:rules`); all 39 real emails added as OAuth test users in the Google Cloud console.
Key files: `src/lib/firebase.ts`, `src/lib/auth.tsx`, `src/app/login/page.tsx`, `firestore.rules`.
Verify: sign in with a seeded test-user account, confirm the matching `people/{personId}` doc gets `ownerUid` set exactly once; a non-listed Google account is blocked by the OAuth consent screen itself before reaching the app.

**Phase 5 — Profile view + edit**
Build: `profile/[personId]/page.tsx` (view: photo, bio, `EgoMiniGraph.tsx` showing only weight≥2 connections); `ProfileEditForm.tsx` (owner-only: bio + photo upload to `profile-photos/{personId}/`, react-hook-form + zod, `storage.rules` committed); clicking a node opens this profile; `PersonNode.tsx` upgraded to render real `photoURL` textures.
Key files: `src/app/profile/[personId]/page.tsx`, `src/components/profile/ProfileEditForm.tsx`, `src/components/profile/EgoMiniGraph.tsx`, `storage.rules`.
Verify: edit own bio/photo as one test user, confirm it renders in the main graph; log in as a second user, confirm you can view but not edit the first person's profile (UI hides edit, and a direct write attempt is rejected by rules).

**Phase 6 — Homework tracker**
Build: `homework/page.tsx`, `HomeworkList.tsx`, `HomeworkForm.tsx` (subject, title, due date, notes, completed toggle); CRUD scoped to `ownerUid == auth.uid`; `homework` rules block deployed.
Key files: `src/app/homework/page.tsx`, `src/components/homework/*`, `firestore.rules`.
Verify: add/edit/delete as one user; second user cannot see the first user's items, in UI or via a manual rules check.

**Phase 7 — GPA tracker (privacy-critical)**
Build: `gpa/page.tsx`, `GpaForm.tsx`, `GpaTable.tsx`, `gpaCalc.ts` (client-side weighted GPA from raw entries); `gpaEntries` rules deployed; this phase is also the checkpoint to run a **real rules test** (Firestore emulator + `@firebase/rules-unit-testing`, or manual console attempts) proving a non-owner read/write is rejected, not just UI-hidden.
Key files: `src/app/gpa/page.tsx`, `src/components/gpa/*`, `firestore.rules`.
Verify: enter GPA as one user; confirm a raw SDK read attempt for another `ownerUid` from the browser console errors with a permissions exception.

**Phase 8 — Events page**
Build: `events/page.tsx`, `EventList.tsx`, `EventForm.tsx` (title, description, start/end, location, optional image + required `imageAlt`); `storage.rules` events path; `events` Firestore rules deployed.
Key files: `src/app/events/page.tsx`, `src/components/events/*`, `firestore.rules`, `storage.rules`.
Verify: any logged-in user can create an event, all see it, only the creator can edit/delete it.

**Phase 9 — Lore page**
Build: `lore/page.tsx`, `LoreWall.tsx` (friendly empty-state when no posts exist), `LorePostForm.tsx` (text + optional image/alt); `lorePosts` rules deployed.
Key files: `src/app/lore/page.tsx`, `src/components/lore/*`, `firestore.rules`.
Verify: fresh deploy shows the empty state; posting as one user shows it to all logged-in users; only the author can delete their own post.

**Phase 10 — Legal, privacy, accessibility, SEO-blocking pass**
Build:
- `privacy/page.tsx`: plain-language notice (what's collected, who sees what), reachable without login, linked from every page.
- `settings/page.tsx` + `src/lib/deleteAccount.ts`: real delete-my-account — re-auth via Google popup, batched delete of the user's `homework`/`gpaEntries`/authored `lorePosts` docs and their Storage photo, reset their `people/{personId}` doc (`ownerUid: null, photoURL: null, bio: ''`), then delete the Auth user. Confirmation modal first (irreversible).
- SEO blocking: `public/robots.txt` (`Disallow: /`) + `metadata.robots = { index: false, follow: false }` in `src/app/layout.tsx` so every page inherits noindex.
- Accessibility audit: verify alt text on every image; run an automated contrast check (axe/Lighthouse) against every pastel/ink combo in `louvainColors.ts`, fix any failing hue; confirm `/people` is fully keyboard-operable end to end.
- Cookie consent: confirm still not needed (only strictly-necessary auth cookies in use); leave a note in the privacy page that adding analytics later would require adding a banner.
Key files: `src/app/privacy/page.tsx`, `src/app/settings/page.tsx`, `src/lib/deleteAccount.ts`, `public/robots.txt`, `src/app/layout.tsx`.
Verify: `curl <hosted-url>/robots.txt` shows `Disallow: /`; view-source shows `noindex` on every route; run delete-account against a disposable test account and confirm via Firebase console its data is actually gone; a11y scan has zero critical violations.

---

## Open items for whoever builds this (not blockers, just flagged)

- **Events edit/delete permissions**: current plan has only the creator able to edit/delete their own event. An `isAdmin` escape-hatch for the site owner to moderate any event was considered but needs an efficient `uid → isAdmin` lookup (a denormalized doc) to add cleanly to rules — treat as a Phase 8+ refinement if moderation becomes necessary, not a v1 requirement.
- Optional "like/react" mechanic on lore posts (`reactions` subcollection) is modeled in the data schema but is a stretch item, not required for MVP.

---

## Data Appendix — full roster and connections (transcribe into Phase 0's JSON files)

**Names (id = kebab-case slug of the name; #39 "You" = the student building this site — map to their own login email)**

1. Ethan Chen Aung
2. Ywn Yamone
3. Rich Cao
4. Micca
5. Irene
6. One One
7. Diego Flores Gil
8. Xiao Long Hein
9. May Moe Htet
10. True
11. Thant Khine
12. Jake
13. Kai Jensen
14. Bom Jin
15. Kota Karasawa
16. MPK
17. Thit Lwin
18. MoMo
19. Lucas
20. Sandaku Kay Khaing Mon
21. Thane Thurane Myint
22. Lin Nadi
23. Mia Nay
24. Shin Shin Nay Wun
25. Joonsung Park
26. Emily
27. Ruby
28. Aiden
29. Estina
30. Thwin Aye
31. Benjy Shaul
32. Kyal Syn Min Han
33. Nway Ei Thanthar
34. Dennis Thu Yine
35. Bram van Lokven
36. Pinky
37. Erika Yati
38. Hazel
39. You

**Connections**: full weighted list, format `Name A - Name B: weight (label)`. Weights: 0=Hate, 1=Don't know each other, 2=Classmates, 3=Friends, 4=Better friends, 5=Good friends. `scripts/validate-data.mjs` (Phase 0) should confirm this parses to exactly 741 rows spanning all 39 names with weights in [0,5] before Phase 1 begins.

```
May Moe Htet - Estina: 5 (Good friends)
May Moe Htet - Ywn Yamone: 5 (Good friends)
May Moe Htet - Bom Jin: 5 (Good friends)
Estina - Hazel: 5 (Good friends)
Ywn Yamone - Bom Jin: 5 (Good friends)
You - MPK: 5 (Good friends)
You - Kai Jensen: 5 (Good friends)
Bram van Lokven - Benjy Shaul: 5 (Good friends)
True - Lin Nadi: 5 (Good friends)
Rich Cao - Ywn Yamone: 5 (Good friends)
Rich Cao - Micca: 5 (Good friends)
Erika Yati - Dennis Thu Yine: 5 (Good friends)
Thant Khine - Emily: 5 (Good friends)
Thant Khine - Lucas: 5 (Good friends)
Pinky - Ruby: 5 (Good friends)
Lucas - Ruby: 5 (Good friends)
Thit Lwin - Emily: 5 (Good friends)
Lin Nadi - Nway Ei Thanthar: 5 (Good friends)
Estina - Dennis Thu Yine: 5 (Good friends)
Lucas - Bom Jin: 5 (Good friends)
Mia Nay - Erika Yati: 5 (Good friends)
Pinky - Irene: 5 (Good friends)
True - Nway Ei Thanthar: 5 (Good friends)
MPK - Rich Cao: 5 (Good friends)
Micca - Dennis Thu Yine: 5 (Good friends)
Dennis Thu Yine - Thane Thurane Myint: 5 (Good friends)
You - Thit Lwin: 5 (Good friends)
Estina - Bom Jin: 4 (Better friends)
Ethan Chen Aung - Kai Jensen: 4 (Better friends)
Ethan Chen Aung - MPK: 4 (Better friends)
Ethan Chen Aung - Lucas: 4 (Better friends)
Ethan Chen Aung - Dennis Thu Yine: 4 (Better friends)
Ethan Chen Aung - Bram van Lokven: 4 (Better friends)
Ethan Chen Aung - You: 4 (Better friends)
Hazel - May Moe Htet: 4 (Better friends)
Hazel - Ywn Yamone: 4 (Better friends)
Hazel - Bom Jin: 4 (Better friends)
Estina - Ywn Yamone: 4 (Better friends)
You - Thane Thurane Myint: 4 (Better friends)
You - Rich Cao: 4 (Better friends)
You - Bram van Lokven: 4 (Better friends)
True - MoMo: 4 (Better friends)
You - True: 4 (Better friends)
MPK - Thane Thurane Myint: 4 (Better friends)
MPK - Kai Jensen: 4 (Better friends)
MPK - Ywn Yamone: 4 (Better friends)
MPK - Lucas: 4 (Better friends)
Rich Cao - Dennis Thu Yine: 4 (Better friends)
Thant Khine - Rich Cao: 4 (Better friends)
Micca - Ruby: 4 (Better friends)
Thant Khine - Dennis Thu Yine: 4 (Better friends)
Pinky - Shin Shin Nay Wun: 4 (Better friends)
Ruby - Shin Shin Nay Wun: 4 (Better friends)
Kai Jensen - Micca: 4 (Better friends)
Kai Jensen - Diego Flores Gil: 4 (Better friends)
Kai Jensen - Jake: 4 (Better friends)
Thit Lwin - One One: 4 (Better friends)
Thit Lwin - Ruby: 4 (Better friends)
Thit Lwin - Irene: 4 (Better friends)
Irene - Ruby: 4 (Better friends)
Irene - Emily: 4 (Better friends)
Pinky - Emily: 4 (Better friends)
Ruby - Emily: 4 (Better friends)
One One - Emily: 4 (Better friends)
Pinky - Thit Lwin: 4 (Better friends)
MoMo - Lin Nadi: 4 (Better friends)
MoMo - Nway Ei Thanthar: 4 (Better friends)
Jake - Joonsung Park: 4 (Better friends)
Micca - Diego Flores Gil: 4 (Better friends)
Bram van Lokven - Thane Thurane Myint: 4 (Better friends)
Dennis Thu Yine - Mia Nay: 4 (Better friends)
Micca - Joonsung Park: 4 (Better friends)
Micca - Jake: 4 (Better friends)
Jake - Diego Flores Gil: 4 (Better friends)
Erika Yati - Emily: 4 (Better friends)
You - Dennis Thu Yine: 4 (Better friends)
Ethan Chen Aung - Thant Khine: 4 (Better friends)
You - Micca: 4 (Better friends)
MPK - Micca: 4 (Better friends)
Erika Yati - Thit Lwin: 3 (Friends)
You - Lucas: 3 (Friends)
Ethan Chen Aung - Thane Thurane Myint: 3 (Friends)
Ethan Chen Aung - Rich Cao: 3 (Friends)
Ethan Chen Aung - Micca: 3 (Friends)
Ethan Chen Aung - One One: 3 (Friends)
Ethan Chen Aung - Diego Flores Gil: 3 (Friends)
Ethan Chen Aung - May Moe Htet: 3 (Friends)
Ethan Chen Aung - Bom Jin: 3 (Friends)
Ethan Chen Aung - Emily: 3 (Friends)
Ethan Chen Aung - Ruby: 3 (Friends)
Ethan Chen Aung - Benjy Shaul: 3 (Friends)
Ethan Chen Aung - Pinky: 3 (Friends)
You - Pinky: 3 (Friends)
You - Diego Flores Gil: 3 (Friends)
You - Thant Khine: 3 (Friends)
You - Benjy Shaul: 3 (Friends)
You - Ruby: 3 (Friends)
You - Thwin Aye: 3 (Friends)
You - Nway Ei Thanthar: 3 (Friends)
You - Estina: 3 (Friends)
You - Kota Karasawa: 3 (Friends)
True - Sandaku Kay Khaing Mon: 3 (Friends)
MPK - Dennis Thu Yine: 3 (Friends)
MPK - Bram van Lokven: 3 (Friends)
MPK - Benjy Shaul: 3 (Friends)
MPK - Diego Flores Gil: 3 (Friends)
MPK - Thant Khine: 3 (Friends)
MPK - True: 3 (Friends)
MPK - Ruby: 3 (Friends)
MPK - May Moe Htet: 3 (Friends)
Rich Cao - Estina: 3 (Friends)
Rich Cao - May Moe Htet: 3 (Friends)
Rich Cao - Bom Jin: 3 (Friends)
Rich Cao - Hazel: 3 (Friends)
Thant Khine - Kai Jensen: 3 (Friends)
Thant Khine - Diego Flores Gil: 3 (Friends)
Thant Khine - Jake: 3 (Friends)
Thant Khine - MoMo: 3 (Friends)
Thant Khine - Thane Thurane Myint: 3 (Friends)
Thant Khine - Micca: 3 (Friends)
Thant Khine - Nway Ei Thanthar: 3 (Friends)
Thant Khine - Ruby: 3 (Friends)
Thant Khine - Benjy Shaul: 3 (Friends)
Thant Khine - Bram van Lokven: 3 (Friends)
Thant Khine - Pinky: 3 (Friends)
True - Xiao Long Hein: 3 (Friends)
True - Kai Jensen: 3 (Friends)
True - Shin Shin Nay Wun: 3 (Friends)
Kai Jensen - Nway Ei Thanthar: 3 (Friends)
Kai Jensen - Lucas: 3 (Friends)
Kai Jensen - May Moe Htet: 3 (Friends)
Kai Jensen - Thane Thurane Myint: 3 (Friends)
Kai Jensen - MoMo: 3 (Friends)
Kai Jensen - Benjy Shaul: 3 (Friends)
Kai Jensen - Dennis Thu Yine: 3 (Friends)
Kai Jensen - Bram van Lokven: 3 (Friends)
Kai Jensen - Rich Cao: 3 (Friends)
Kai Jensen - Joonsung Park: 3 (Friends)
Lucas - Thane Thurane Myint: 3 (Friends)
Lucas - Bram van Lokven: 3 (Friends)
Lucas - Benjy Shaul: 3 (Friends)
Lucas - Dennis Thu Yine: 3 (Friends)
Lin Nadi - Shin Shin Nay Wun: 3 (Friends)
One One - Ruby: 3 (Friends)
One One - Pinky: 3 (Friends)
Thwin Aye - Xiao Long Hein: 3 (Friends)
Micca - Bram van Lokven: 3 (Friends)
Thane Thurane Myint - Pinky: 3 (Friends)
Lucas - Rich Cao: 3 (Friends)
Lucas - Diego Flores Gil: 3 (Friends)
Thane Thurane Myint - Nway Ei Thanthar: 3 (Friends)
Thane Thurane Myint - Diego Flores Gil: 3 (Friends)
Ywn Yamone - Aiden: 3 (Friends)
Rich Cao - Bram van Lokven: 3 (Friends)
Rich Cao - Diego Flores Gil: 3 (Friends)
Rich Cao - Thane Thurane Myint: 3 (Friends)
Ruby - Bram van Lokven: 3 (Friends)
Bram van Lokven - Hazel: 3 (Friends)
Bram van Lokven - Dennis Thu Yine: 3 (Friends)
Bram van Lokven - Bom Jin: 3 (Friends)
Bram van Lokven - Ywn Yamone: 3 (Friends)
Bram van Lokven - Pinky: 3 (Friends)
MoMo - Sandaku Kay Khaing Mon: 3 (Friends)
Sandaku Kay Khaing Mon - Shin Shin Nay Wun: 3 (Friends)
Bram van Lokven - Diego Flores Gil: 3 (Friends)
Thane Thurane Myint - Shin Shin Nay Wun: 3 (Friends)
Thane Thurane Myint - Ruby: 3 (Friends)
Thane Thurane Myint - Benjy Shaul: 3 (Friends)
Thane Thurane Myint - Micca: 3 (Friends)
Aiden - Bom Jin: 3 (Friends)
Shin Shin Nay Wun - One One: 3 (Friends)
Sandaku Kay Khaing Mon - Lin Nadi: 3 (Friends)
Joonsung Park - Estina: 3 (Friends)
May Moe Htet - You: 3 (Friends)
May Moe Htet - Aiden: 3 (Friends)
Thane Thurane Myint - Kota Karasawa: 3 (Friends)
Nway Ei Thanthar - Sandaku Kay Khaing Mon: 3 (Friends)
Lin Nadi - Ruby: 3 (Friends)
Nway Ei Thanthar - Xiao Long Hein: 3 (Friends)
MoMo - Xiao Long Hein: 3 (Friends)
Bom Jin - Jake: 3 (Friends)
Bom Jin - Pinky: 3 (Friends)
Bom Jin - Ruby: 3 (Friends)
Ruby - Jake: 3 (Friends)
Erika Yati - One One: 3 (Friends)
Pinky - Xiao Long Hein: 3 (Friends)
Ruby - Xiao Long Hein: 3 (Friends)
One One - Irene: 3 (Friends)
Shin Shin Nay Wun - Irene: 3 (Friends)
Emily - Shin Shin Nay Wun: 3 (Friends)
Ethan Chen Aung - Jake: 2 (Classmates)
Ethan Chen Aung - Joonsung Park: 2 (Classmates)
Ethan Chen Aung - Thwin Aye: 2 (Classmates)
Ethan Chen Aung - Nway Ei Thanthar: 2 (Classmates)
Ethan Chen Aung - Hazel: 2 (Classmates)
Ethan Chen Aung - Ywn Yamone: 2 (Classmates)
MPK - Kota Karasawa: 2 (Classmates)
MPK - Estina: 2 (Classmates)
MPK - Bom Jin: 2 (Classmates)
True - One One: 2 (Classmates)
True - Emily: 2 (Classmates)
True - Ruby: 2 (Classmates)
Micca - Ywn Yamone: 2 (Classmates)
One One - Nway Ei Thanthar: 2 (Classmates)
Dennis Thu Yine - Ruby: 2 (Classmates)
Erika Yati - Ruby: 2 (Classmates)
Pinky - Sandaku Kay Khaing Mon: 2 (Classmates)
You - One One: 2 (Classmates)
You - Jake: 2 (Classmates)
You - Joonsung Park: 2 (Classmates)
You - Emily: 2 (Classmates)
You - Bom Jin: 2 (Classmates)
You - Hazel: 2 (Classmates)
You - Ywn Yamone: 2 (Classmates)
You - Shin Shin Nay Wun: 2 (Classmates)
You - Lin Nadi: 2 (Classmates)
You - Mia Nay: 2 (Classmates)
You - Sandaku Kay Khaing Mon: 2 (Classmates)
You - MoMo: 2 (Classmates)
You - Xiao Long Hein: 2 (Classmates)
You - Irene: 2 (Classmates)
You - Kyal Syn Min Han: 2 (Classmates)
Ethan Chen Aung - Shin Shin Nay Wun: 2 (Classmates)
Ethan Chen Aung - Lin Nadi: 2 (Classmates)
Ethan Chen Aung - Sandaku Kay Khaing Mon: 2 (Classmates)
Ethan Chen Aung - MoMo: 2 (Classmates)
Ethan Chen Aung - True: 2 (Classmates)
Ethan Chen Aung - Kota Karasawa: 2 (Classmates)
Ethan Chen Aung - Thit Lwin: 2 (Classmates)
Ethan Chen Aung - Irene: 2 (Classmates)
Ethan Chen Aung - Erika Yati: 2 (Classmates)
Ethan Chen Aung - Estina: 2 (Classmates)
Ethan Chen Aung - Kyal Syn Min Han: 2 (Classmates)
MPK - One One: 2 (Classmates)
MPK - Irene: 2 (Classmates)
MPK - Jake: 2 (Classmates)
MPK - MoMo: 2 (Classmates)
MPK - Sandaku Kay Khaing Mon: 2 (Classmates)
MPK - Lin Nadi: 2 (Classmates)
MPK - Thit Lwin: 2 (Classmates)
MPK - Joonsung Park: 2 (Classmates)
MPK - Nway Ei Thanthar: 2 (Classmates)
MPK - Shin Shin Nay Wun: 2 (Classmates)
MPK - Emily: 2 (Classmates)
MPK - Xiao Long Hein: 2 (Classmates)
MPK - Pinky: 2 (Classmates)
MPK - Thwin Aye: 2 (Classmates)
MPK - Hazel: 2 (Classmates)
MPK - Kyal Syn Min Han: 2 (Classmates)
Thant Khine - One One: 2 (Classmates)
Thant Khine - Xiao Long Hein: 2 (Classmates)
Thant Khine - Kota Karasawa: 2 (Classmates)
Thant Khine - Sandaku Kay Khaing Mon: 2 (Classmates)
Thant Khine - Thit Lwin: 2 (Classmates)
Thant Khine - True: 2 (Classmates)
Thant Khine - Lin Nadi: 2 (Classmates)
Thant Khine - Shin Shin Nay Wun: 2 (Classmates)
Thant Khine - Joonsung Park: 2 (Classmates)
Thant Khine - Irene: 2 (Classmates)
Thant Khine - Bom Jin: 2 (Classmates)
Thant Khine - Estina: 2 (Classmates)
Thant Khine - Hazel: 2 (Classmates)
Thant Khine - Ywn Yamone: 2 (Classmates)
Thant Khine - Kyal Syn Min Han: 2 (Classmates)
Thant Khine - Thwin Aye: 2 (Classmates)
Thant Khine - May Moe Htet: 2 (Classmates)
Micca - Bom Jin: 2 (Classmates)
True - Thane Thurane Myint: 2 (Classmates)
True - Jake: 2 (Classmates)
True - Lucas: 2 (Classmates)
True - Thit Lwin: 2 (Classmates)
True - Kota Karasawa: 2 (Classmates)
True - Diego Flores Gil: 2 (Classmates)
True - Irene: 2 (Classmates)
True - Joonsung Park: 2 (Classmates)
True - Rich Cao: 2 (Classmates)
True - Micca: 2 (Classmates)
True - Dennis Thu Yine: 2 (Classmates)
True - Bram van Lokven: 2 (Classmates)
True - Benjy Shaul: 2 (Classmates)
True - May Moe Htet: 2 (Classmates)
True - Ywn Yamone: 2 (Classmates)
True - Bom Jin: 2 (Classmates)
True - Erika Yati: 2 (Classmates)
True - Kyal Syn Min Han: 2 (Classmates)
True - Estina: 2 (Classmates)
True - Hazel: 2 (Classmates)
True - Pinky: 2 (Classmates)
Kai Jensen - Ruby: 2 (Classmates)
Kai Jensen - Irene: 2 (Classmates)
Kai Jensen - Kyal Syn Min Han: 2 (Classmates)
Kai Jensen - Xiao Long Hein: 2 (Classmates)
Kai Jensen - Thit Lwin: 2 (Classmates)
Kai Jensen - Kota Karasawa: 2 (Classmates)
Kai Jensen - Sandaku Kay Khaing Mon: 2 (Classmates)
Kai Jensen - Lin Nadi: 2 (Classmates)
Kai Jensen - Emily: 2 (Classmates)
Kai Jensen - Pinky: 2 (Classmates)
Kai Jensen - Shin Shin Nay Wun: 2 (Classmates)
Kai Jensen - Ywn Yamone: 2 (Classmates)
Kai Jensen - Hazel: 2 (Classmates)
Kai Jensen - Bom Jin: 2 (Classmates)
Kai Jensen - Estina: 2 (Classmates)
Kai Jensen - Thwin Aye: 2 (Classmates)
Lucas - Kyal Syn Min Han: 2 (Classmates)
Lucas - Irene: 2 (Classmates)
Lucas - Pinky: 2 (Classmates)
Lucas - Nway Ei Thanthar: 2 (Classmates)
Lucas - Thit Lwin: 2 (Classmates)
Lucas - Thwin Aye: 2 (Classmates)
Lucas - Emily: 2 (Classmates)
Lucas - Lin Nadi: 2 (Classmates)
Lucas - Shin Shin Nay Wun: 2 (Classmates)
Shin Shin Nay Wun - Thit Lwin: 2 (Classmates)
Shin Shin Nay Wun - Nway Ei Thanthar: 2 (Classmates)
Pinky - Nway Ei Thanthar: 2 (Classmates)
Jake - Xiao Long Hein: 2 (Classmates)
Jake - Kota Karasawa: 2 (Classmates)
Kota Karasawa - Thwin Aye: 2 (Classmates)
Thwin Aye - MoMo: 2 (Classmates)
MoMo - Mia Nay: 2 (Classmates)
Mia Nay - Lin Nadi: 2 (Classmates)
Xiao Long Hein - Ywn Yamone: 2 (Classmates)
Xiao Long Hein - Diego Flores Gil: 2 (Classmates)
Micca - Estina: 2 (Classmates)
Thane Thurane Myint - Jake: 2 (Classmates)
Thane Thurane Myint - Joonsung Park: 2 (Classmates)
Thane Thurane Myint - Thwin Aye: 2 (Classmates)
Thane Thurane Myint - MoMo: 2 (Classmates)
Thane Thurane Myint - Lin Nadi: 2 (Classmates)
One One - Aiden: 2 (Classmates)
Lucas - Micca: 2 (Classmates)
Micca - MoMo: 2 (Classmates)
Lucas - Xiao Long Hein: 2 (Classmates)
Lucas - Jake: 2 (Classmates)
Lucas - Kota Karasawa: 2 (Classmates)
Lucas - Joonsung Park: 2 (Classmates)
Lucas - Ywn Yamone: 2 (Classmates)
Lucas - Hazel: 2 (Classmates)
Lucas - May Moe Htet: 2 (Classmates)
Lucas - Estina: 2 (Classmates)
Lucas - One One: 2 (Classmates)
Rich Cao - Thit Lwin: 2 (Classmates)
Rich Cao - One One: 2 (Classmates)
Rich Cao - Shin Shin Nay Wun: 2 (Classmates)
Rich Cao - Emily: 2 (Classmates)
Rich Cao - Pinky: 2 (Classmates)
Rich Cao - Irene: 2 (Classmates)
Rich Cao - Benjy Shaul: 2 (Classmates)
Rich Cao - Erika Yati: 2 (Classmates)
Rich Cao - Jake: 2 (Classmates)
Rich Cao - Joonsung Park: 2 (Classmates)
Rich Cao - Thwin Aye: 2 (Classmates)
Rich Cao - MoMo: 2 (Classmates)
Rich Cao - Nway Ei Thanthar: 2 (Classmates)
Rich Cao - Lin Nadi: 2 (Classmates)
Rich Cao - Ruby: 2 (Classmates)
Kyal Syn Min Han - Benjy Shaul: 2 (Classmates)
Kyal Syn Min Han - Bram van Lokven: 2 (Classmates)
Kyal Syn Min Han - Ruby: 2 (Classmates)
Kyal Syn Min Han - Irene: 2 (Classmates)
Kyal Syn Min Han - Pinky: 2 (Classmates)
Kyal Syn Min Han - Thit Lwin: 2 (Classmates)
Kyal Syn Min Han - One One: 2 (Classmates)
Kyal Syn Min Han - Emily: 2 (Classmates)
Kyal Syn Min Han - Shin Shin Nay Wun: 2 (Classmates)
Kyal Syn Min Han - Lin Nadi: 2 (Classmates)
Kyal Syn Min Han - Sandaku Kay Khaing Mon: 2 (Classmates)
Jake - Mia Nay: 2 (Classmates)
Kyal Syn Min Han - Thane Thurane Myint: 2 (Classmates)
Kyal Syn Min Han - MoMo: 2 (Classmates)
Kyal Syn Min Han - Thwin Aye: 2 (Classmates)
Kyal Syn Min Han - Xiao Long Hein: 2 (Classmates)
Kyal Syn Min Han - Joonsung Park: 2 (Classmates)
Kyal Syn Min Han - Diego Flores Gil: 2 (Classmates)
Kyal Syn Min Han - Jake: 2 (Classmates)
Kyal Syn Min Han - Kota Karasawa: 2 (Classmates)
Kyal Syn Min Han - Hazel: 2 (Classmates)
Kyal Syn Min Han - Ywn Yamone: 2 (Classmates)
Kyal Syn Min Han - Micca: 2 (Classmates)
Kyal Syn Min Han - Dennis Thu Yine: 2 (Classmates)
Kyal Syn Min Han - Bom Jin: 2 (Classmates)
Kyal Syn Min Han - Estina: 2 (Classmates)
Kyal Syn Min Han - May Moe Htet: 2 (Classmates)
Kyal Syn Min Han - Nway Ei Thanthar: 2 (Classmates)
Ruby - Benjy Shaul: 2 (Classmates)
Bram van Lokven - Erika Yati: 2 (Classmates)
Bram van Lokven - Estina: 2 (Classmates)
Bram van Lokven - May Moe Htet: 2 (Classmates)
Bram van Lokven - Thit Lwin: 2 (Classmates)
Bram van Lokven - Irene: 2 (Classmates)
Bram van Lokven - Shin Shin Nay Wun: 2 (Classmates)
Bram van Lokven - One One: 2 (Classmates)
Bram van Lokven - Emily: 2 (Classmates)
Bram van Lokven - Nway Ei Thanthar: 2 (Classmates)
Bram van Lokven - Sandaku Kay Khaing Mon: 2 (Classmates)
Bram van Lokven - MoMo: 2 (Classmates)
Bram van Lokven - Lin Nadi: 2 (Classmates)
Bram van Lokven - Thwin Aye: 2 (Classmates)
Bram van Lokven - Xiao Long Hein: 2 (Classmates)
Mia Nay - Xiao Long Hein: 2 (Classmates)
Thwin Aye - Mia Nay: 2 (Classmates)
Dennis Thu Yine - Bom Jin: 2 (Classmates)
Dennis Thu Yine - May Moe Htet: 2 (Classmates)
Dennis Thu Yine - Hazel: 2 (Classmates)
Dennis Thu Yine - Kota Karasawa: 2 (Classmates)
Dennis Thu Yine - Benjy Shaul: 2 (Classmates)
Dennis Thu Yine - Irene: 2 (Classmates)
Dennis Thu Yine - Pinky: 2 (Classmates)
Dennis Thu Yine - Thit Lwin: 2 (Classmates)
Dennis Thu Yine - Emily: 2 (Classmates)
Dennis Thu Yine - Shin Shin Nay Wun: 2 (Classmates)
Dennis Thu Yine - One One: 2 (Classmates)
Dennis Thu Yine - Nway Ei Thanthar: 2 (Classmates)
Dennis Thu Yine - Lin Nadi: 2 (Classmates)
Dennis Thu Yine - Sandaku Kay Khaing Mon: 2 (Classmates)
Dennis Thu Yine - MoMo: 2 (Classmates)
Dennis Thu Yine - Thwin Aye: 2 (Classmates)
Dennis Thu Yine - Xiao Long Hein: 2 (Classmates)
Dennis Thu Yine - Joonsung Park: 2 (Classmates)
Dennis Thu Yine - Jake: 2 (Classmates)
Dennis Thu Yine - Diego Flores Gil: 2 (Classmates)
Bram van Lokven - Jake: 2 (Classmates)
Bram van Lokven - Kota Karasawa: 2 (Classmates)
Bram van Lokven - Joonsung Park: 2 (Classmates)
Thane Thurane Myint - Thit Lwin: 2 (Classmates)
Thane Thurane Myint - One One: 2 (Classmates)
Thane Thurane Myint - Emily: 2 (Classmates)
Thane Thurane Myint - Irene: 2 (Classmates)
Thane Thurane Myint - Erika Yati: 2 (Classmates)
Thane Thurane Myint - Estina: 2 (Classmates)
Thane Thurane Myint - Bom Jin: 2 (Classmates)
Thane Thurane Myint - May Moe Htet: 2 (Classmates)
Thane Thurane Myint - Hazel: 2 (Classmates)
Thane Thurane Myint - Ywn Yamone: 2 (Classmates)
Benjy Shaul - Estina: 2 (Classmates)
Benjy Shaul - Micca: 2 (Classmates)
Benjy Shaul - Hazel: 2 (Classmates)
Benjy Shaul - May Moe Htet: 2 (Classmates)
Benjy Shaul - Bom Jin: 2 (Classmates)
Benjy Shaul - Ywn Yamone: 2 (Classmates)
Benjy Shaul - Pinky: 2 (Classmates)
Joonsung Park - Thwin Aye: 2 (Classmates)
Joonsung Park - Diego Flores Gil: 2 (Classmates)
Kota Karasawa - Diego Flores Gil: 2 (Classmates)
Erika Yati - Irene: 2 (Classmates)
Shin Shin Nay Wun - Mia Nay: 2 (Classmates)
Shin Shin Nay Wun - Kota Karasawa: 2 (Classmates)
Ruby - Sandaku Kay Khaing Mon: 2 (Classmates)
Ruby - Thwin Aye: 2 (Classmates)
Sandaku Kay Khaing Mon - Xiao Long Hein: 2 (Classmates)
Joonsung Park - Benjy Shaul: 2 (Classmates)
Joonsung Park - Bom Jin: 2 (Classmates)
Joonsung Park - Ywn Yamone: 2 (Classmates)
Joonsung Park - Hazel: 2 (Classmates)
Joonsung Park - May Moe Htet: 2 (Classmates)
Kota Karasawa - May Moe Htet: 2 (Classmates)
Kota Karasawa - MoMo: 2 (Classmates)
Kota Karasawa - Hazel: 2 (Classmates)
Kota Karasawa - Estina: 2 (Classmates)
Kota Karasawa - Ywn Yamone: 2 (Classmates)
Kota Karasawa - Bom Jin: 2 (Classmates)
Kota Karasawa - Joonsung Park: 2 (Classmates)
Kota Karasawa - Benjy Shaul: 2 (Classmates)
Kota Karasawa - Micca: 2 (Classmates)
Kota Karasawa - Lin Nadi: 2 (Classmates)
Kota Karasawa - Nway Ei Thanthar: 2 (Classmates)
Kota Karasawa - Mia Nay: 2 (Classmates)
Kota Karasawa - One One: 2 (Classmates)
Kota Karasawa - Sandaku Kay Khaing Mon: 2 (Classmates)
Kota Karasawa - Erika Yati: 2 (Classmates)
Kota Karasawa - Xiao Long Hein: 2 (Classmates)
Kota Karasawa - Pinky: 2 (Classmates)
Kota Karasawa - Thit Lwin: 2 (Classmates)
Shin Shin Nay Wun - Thwin Aye: 2 (Classmates)
Kota Karasawa - Ruby: 2 (Classmates)
Kota Karasawa - Emily: 2 (Classmates)
Kota Karasawa - Irene: 2 (Classmates)
MoMo - Estina: 2 (Classmates)
MoMo - Hazel: 2 (Classmates)
MoMo - May Moe Htet: 2 (Classmates)
MoMo - Ywn Yamone: 2 (Classmates)
MoMo - Bom Jin: 2 (Classmates)
MoMo - Joonsung Park: 2 (Classmates)
MoMo - Benjy Shaul: 2 (Classmates)
MoMo - Diego Flores Gil: 2 (Classmates)
MoMo - Jake: 2 (Classmates)
MoMo - Irene: 2 (Classmates)
MoMo - Emily: 2 (Classmates)
Sandaku Kay Khaing Mon - Thwin Aye: 2 (Classmates)
Sandaku Kay Khaing Mon - Mia Nay: 2 (Classmates)
Sandaku Kay Khaing Mon - Erika Yati: 2 (Classmates)
Sandaku Kay Khaing Mon - One One: 2 (Classmates)
Irene - Jake: 2 (Classmates)
Lin Nadi - Estina: 2 (Classmates)
Lin Nadi - Hazel: 2 (Classmates)
Lin Nadi - May Moe Htet: 2 (Classmates)
Lin Nadi - Pinky: 2 (Classmates)
Lin Nadi - Emily: 2 (Classmates)
Mia Nay - One One: 2 (Classmates)
Irene - Diego Flores Gil: 2 (Classmates)
Irene - Micca: 2 (Classmates)
Irene - Joonsung Park: 2 (Classmates)
Irene - Bom Jin: 2 (Classmates)
Irene - Ywn Yamone: 2 (Classmates)
Irene - May Moe Htet: 2 (Classmates)
Irene - Hazel: 2 (Classmates)
Irene - Estina: 2 (Classmates)
Irene - Thwin Aye: 2 (Classmates)
Lin Nadi - One One: 2 (Classmates)
Nway Ei Thanthar - Thwin Aye: 2 (Classmates)
Xiao Long Hein - Lin Nadi: 2 (Classmates)
Lin Nadi - Thit Lwin: 2 (Classmates)
Lin Nadi - Irene: 2 (Classmates)
Lin Nadi - Micca: 2 (Classmates)
Lin Nadi - Benjy Shaul: 2 (Classmates)
Lin Nadi - Diego Flores Gil: 2 (Classmates)
Lin Nadi - Jake: 2 (Classmates)
Lin Nadi - Bom Jin: 2 (Classmates)
Lin Nadi - Joonsung Park: 2 (Classmates)
Lin Nadi - Ywn Yamone: 2 (Classmates)
Lin Nadi - Thwin Aye: 2 (Classmates)
Lin Nadi - Erika Yati: 2 (Classmates)
Bom Jin - Diego Flores Gil: 2 (Classmates)
Bom Jin - Emily: 2 (Classmates)
Bom Jin - Thit Lwin: 2 (Classmates)
Bom Jin - One One: 2 (Classmates)
Bom Jin - Erika Yati: 2 (Classmates)
Bom Jin - Shin Shin Nay Wun: 2 (Classmates)
Bom Jin - Mia Nay: 2 (Classmates)
Bom Jin - Nway Ei Thanthar: 2 (Classmates)
Bom Jin - Sandaku Kay Khaing Mon: 2 (Classmates)
Bom Jin - Xiao Long Hein: 2 (Classmates)
Bom Jin - Thwin Aye: 2 (Classmates)
Thwin Aye - Estina: 2 (Classmates)
Thwin Aye - Hazel: 2 (Classmates)
Thwin Aye - May Moe Htet: 2 (Classmates)
Thwin Aye - Ywn Yamone: 2 (Classmates)
Thwin Aye - Micca: 2 (Classmates)
MoMo - Shin Shin Nay Wun: 2 (Classmates)
MoMo - Erika Yati: 2 (Classmates)
MoMo - One One: 2 (Classmates)
MoMo - Pinky: 2 (Classmates)
MoMo - Thit Lwin: 2 (Classmates)
MoMo - Ruby: 2 (Classmates)
Nway Ei Thanthar - Ruby: 2 (Classmates)
Nway Ei Thanthar - Thit Lwin: 2 (Classmates)
Nway Ei Thanthar - Emily: 2 (Classmates)
Nway Ei Thanthar - Irene: 2 (Classmates)
Nway Ei Thanthar - Micca: 2 (Classmates)
Nway Ei Thanthar - Jake: 2 (Classmates)
Nway Ei Thanthar - Diego Flores Gil: 2 (Classmates)
Nway Ei Thanthar - Joonsung Park: 2 (Classmates)
Nway Ei Thanthar - Ywn Yamone: 2 (Classmates)
Nway Ei Thanthar - Benjy Shaul: 2 (Classmates)
Nway Ei Thanthar - May Moe Htet: 2 (Classmates)
Nway Ei Thanthar - Estina: 2 (Classmates)
Nway Ei Thanthar - Hazel: 2 (Classmates)
Nway Ei Thanthar - Mia Nay: 2 (Classmates)
Nway Ei Thanthar - Erika Yati: 2 (Classmates)
Erika Yati - Pinky: 2 (Classmates)
Thwin Aye - Benjy Shaul: 2 (Classmates)
Thwin Aye - Diego Flores Gil: 2 (Classmates)
Thwin Aye - Jake: 2 (Classmates)
Thwin Aye - Emily: 2 (Classmates)
Thwin Aye - Thit Lwin: 2 (Classmates)
Thwin Aye - Pinky: 2 (Classmates)
Thwin Aye - One One: 2 (Classmates)
Thwin Aye - Erika Yati: 2 (Classmates)
Pinky - Micca: 2 (Classmates)
Pinky - Jake: 2 (Classmates)
Pinky - Diego Flores Gil: 2 (Classmates)
Pinky - Joonsung Park: 2 (Classmates)
Pinky - Ywn Yamone: 2 (Classmates)
Pinky - May Moe Htet: 2 (Classmates)
Pinky - Hazel: 2 (Classmates)
Pinky - Mia Nay: 2 (Classmates)
Pinky - Estina: 2 (Classmates)
Ruby - Diego Flores Gil: 2 (Classmates)
Ruby - Joonsung Park: 2 (Classmates)
Ruby - Ywn Yamone: 2 (Classmates)
Ruby - May Moe Htet: 2 (Classmates)
Ruby - Estina: 2 (Classmates)
Ruby - Hazel: 2 (Classmates)
Ruby - Mia Nay: 2 (Classmates)
Estina - Xiao Long Hein: 2 (Classmates)
Estina - Sandaku Kay Khaing Mon: 2 (Classmates)
Estina - Mia Nay: 2 (Classmates)
Estina - One One: 2 (Classmates)
Estina - Thit Lwin: 2 (Classmates)
Estina - Emily: 2 (Classmates)
Estina - Jake: 2 (Classmates)
Estina - Erika Yati: 2 (Classmates)
Estina - Diego Flores Gil: 2 (Classmates)
Estina - Shin Shin Nay Wun: 2 (Classmates)
Benjy Shaul - Diego Flores Gil: 2 (Classmates)
Diego Flores Gil - Ywn Yamone: 2 (Classmates)
Diego Flores Gil - May Moe Htet: 2 (Classmates)
Diego Flores Gil - Hazel: 2 (Classmates)
Diego Flores Gil - Sandaku Kay Khaing Mon: 2 (Classmates)
Diego Flores Gil - Mia Nay: 2 (Classmates)
Diego Flores Gil - Shin Shin Nay Wun: 2 (Classmates)
Diego Flores Gil - One One: 2 (Classmates)
Diego Flores Gil - Thit Lwin: 2 (Classmates)
Diego Flores Gil - Emily: 2 (Classmates)
Diego Flores Gil - Erika Yati: 2 (Classmates)
Jake - Emily: 2 (Classmates)
Jake - One One: 2 (Classmates)
Jake - Erika Yati: 2 (Classmates)
Jake - Shin Shin Nay Wun: 2 (Classmates)
Jake - Sandaku Kay Khaing Mon: 2 (Classmates)
Jake - Hazel: 2 (Classmates)
Jake - May Moe Htet: 2 (Classmates)
Jake - Ywn Yamone: 2 (Classmates)
Xiao Long Hein - Hazel: 2 (Classmates)
Xiao Long Hein - May Moe Htet: 2 (Classmates)
Xiao Long Hein - Micca: 2 (Classmates)
Xiao Long Hein - One One: 2 (Classmates)
Xiao Long Hein - Thit Lwin: 2 (Classmates)
Xiao Long Hein - Emily: 2 (Classmates)
Xiao Long Hein - Erika Yati: 2 (Classmates)
Xiao Long Hein - Shin Shin Nay Wun: 2 (Classmates)
Xiao Long Hein - Joonsung Park: 2 (Classmates)
Xiao Long Hein - Benjy Shaul: 2 (Classmates)
Xiao Long Hein - Irene: 2 (Classmates)
Sandaku Kay Khaing Mon - Thit Lwin: 2 (Classmates)
Sandaku Kay Khaing Mon - Emily: 2 (Classmates)
Sandaku Kay Khaing Mon - Irene: 2 (Classmates)
Sandaku Kay Khaing Mon - Hazel: 2 (Classmates)
Sandaku Kay Khaing Mon - May Moe Htet: 2 (Classmates)
Sandaku Kay Khaing Mon - Ywn Yamone: 2 (Classmates)
Sandaku Kay Khaing Mon - Benjy Shaul: 2 (Classmates)
Sandaku Kay Khaing Mon - Joonsung Park: 2 (Classmates)
May Moe Htet - Mia Nay: 2 (Classmates)
May Moe Htet - Shin Shin Nay Wun: 2 (Classmates)
May Moe Htet - Thit Lwin: 2 (Classmates)
May Moe Htet - Erika Yati: 2 (Classmates)
May Moe Htet - One One: 2 (Classmates)
May Moe Htet - Emily: 2 (Classmates)
May Moe Htet - Micca: 2 (Classmates)
One One - Benjy Shaul: 2 (Classmates)
One One - Ywn Yamone: 2 (Classmates)
One One - Hazel: 2 (Classmates)
One One - Joonsung Park: 2 (Classmates)
One One - Micca: 2 (Classmates)
Irene - Mia Nay: 2 (Classmates)
Mia Nay - Ywn Yamone: 2 (Classmates)
Mia Nay - Hazel: 2 (Classmates)
Mia Nay - Joonsung Park: 2 (Classmates)
Mia Nay - Benjy Shaul: 2 (Classmates)
Mia Nay - Thit Lwin: 2 (Classmates)
Mia Nay - Emily: 2 (Classmates)
Mia Nay - Micca: 2 (Classmates)
Micca - Emily: 2 (Classmates)
Micca - Thit Lwin: 2 (Classmates)
Micca - Hazel: 2 (Classmates)
Micca - Shin Shin Nay Wun: 2 (Classmates)
Jake - Thit Lwin: 2 (Classmates)
Jake - Benjy Shaul: 2 (Classmates)
Joonsung Park - Shin Shin Nay Wun: 2 (Classmates)
Joonsung Park - Erika Yati: 2 (Classmates)
Joonsung Park - Thit Lwin: 2 (Classmates)
Joonsung Park - Emily: 2 (Classmates)
Benjy Shaul - Shin Shin Nay Wun: 2 (Classmates)
Benjy Shaul - Thit Lwin: 2 (Classmates)
Benjy Shaul - Emily: 2 (Classmates)
Shin Shin Nay Wun - Erika Yati: 2 (Classmates)
Shin Shin Nay Wun - Hazel: 2 (Classmates)
Hazel - Erika Yati: 2 (Classmates)
Hazel - Thit Lwin: 2 (Classmates)
Hazel - Emily: 2 (Classmates)
Thit Lwin - Ywn Yamone: 2 (Classmates)
Erika Yati - Ywn Yamone: 2 (Classmates)
Emily - Ywn Yamone: 2 (Classmates)
Ywn Yamone - Shin Shin Nay Wun: 2 (Classmates)
You - Erika Yati: 1 (Don't know each other)
Ethan Chen Aung - Mia Nay: 1 (Don't know each other)
Ethan Chen Aung - Xiao Long Hein: 1 (Don't know each other)
MPK - Erika Yati: 1 (Don't know each other)
MPK - Mia Nay: 1 (Don't know each other)
Erika Yati - Micca: 1 (Don't know each other)
Thant Khine - Erika Yati: 1 (Don't know each other)
Thant Khine - Mia Nay: 1 (Don't know each other)
True - Mia Nay: 1 (Don't know each other)
True - Aiden: 1 (Don't know each other)
True - Thwin Aye: 1 (Don't know each other)
Kai Jensen - One One: 1 (Don't know each other)
Kai Jensen - Aiden: 1 (Don't know each other)
Kai Jensen - Mia Nay: 1 (Don't know each other)
Kai Jensen - Erika Yati: 1 (Don't know each other)
Lucas - Erika Yati: 1 (Don't know each other)
Aiden - Irene: 1 (Don't know each other)
Thane Thurane Myint - Xiao Long Hein: 1 (Don't know each other)
Thane Thurane Myint - Sandaku Kay Khaing Mon: 1 (Don't know each other)
Thane Thurane Myint - Mia Nay: 1 (Don't know each other)
Lucas - Aiden: 1 (Don't know each other)
Lucas - Mia Nay: 1 (Don't know each other)
Micca - Sandaku Kay Khaing Mon: 1 (Don't know each other)
Lucas - MoMo: 1 (Don't know each other)
Lucas - Sandaku Kay Khaing Mon: 1 (Don't know each other)
Dennis Thu Yine - Aiden: 1 (Don't know each other)
Rich Cao - Kyal Syn Min Han: 1 (Don't know each other)
Rich Cao - Kota Karasawa: 1 (Don't know each other)
Rich Cao - Sandaku Kay Khaing Mon: 1 (Don't know each other)
Rich Cao - Mia Nay: 1 (Don't know each other)
Benjy Shaul - Irene: 1 (Don't know each other)
Kyal Syn Min Han - Erika Yati: 1 (Don't know each other)
Kyal Syn Min Han - Aiden: 1 (Don't know each other)
Kyal Syn Min Han - Mia Nay: 1 (Don't know each other)
Bram van Lokven - Mia Nay: 1 (Don't know each other)
Erika Yati - Benjy Shaul: 1 (Don't know each other)
Aiden - Diego Flores Gil: 1 (Don't know each other)
Aiden - Jake: 1 (Don't know each other)
Aiden - Joonsung Park: 1 (Don't know each other)
Aiden - Xiao Long Hein: 1 (Don't know each other)
Aiden - Lin Nadi: 1 (Don't know each other)
Aiden - Sandaku Kay Khaing Mon: 1 (Don't know each other)
Aiden - Mia Nay: 1 (Don't know each other)
Aiden - Estina: 1 (Don't know each other)
Aiden - Thit Lwin: 1 (Don't know each other)
Aiden - Emily: 1 (Don't know each other)
Aiden - Benjy Shaul: 1 (Don't know each other)
Aiden - Erika Yati: 1 (Don't know each other)
Aiden - Nway Ei Thanthar: 0 (Hate)
Ethan Chen Aung - Aiden: 0 (Hate)
MPK - Aiden: 0 (Hate)
You - Aiden: 0 (Hate)
Hazel - Aiden: 0 (Hate)
Thant Khine - Aiden: 0 (Hate)
Bram van Lokven - Aiden: 0 (Hate)
Pinky - Aiden: 0 (Hate)
Ruby - Aiden: 0 (Hate)
Dennis Thu Yine - Ywn Yamone: 0 (Hate)
Rich Cao - Aiden: 0 (Hate)
Rich Cao - Xiao Long Hein: 0 (Hate)
Thane Thurane Myint - Aiden: 0 (Hate)
Aiden - Kota Karasawa: 0 (Hate)
Aiden - Thwin Aye: 0 (Hate)
Aiden - MoMo: 0 (Hate)
Aiden - Micca: 0 (Hate)
Aiden - Shin Shin Nay Wun: 0 (Hate)
```

Note: the entries above total fewer than 741 lines as pasted in the original planning conversation (some pairs among the 39 people were not explicitly listed, meaning C(39,2)=741 is the theoretical maximum, not a guarantee every pair was rated). `scripts/validate-data.mjs` should report the actual row count and flag any of the 39 names with an unexpectedly low number of rated connections, rather than hard-failing on a row count other than 741 — treat 741 as an upper bound, not a strict requirement.
