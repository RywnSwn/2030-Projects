# Class of 2030 friend map

A private site for one grade at ISY. The landing page runs Louvain community
detection over a self-collected friendship dataset (39 people, every pair
rated 0 to 5) and draws it as a semi-3D map colored by detected friend group.
Later phases add profiles, a homework tracker, a private GPA tracker, events,
and a lore wall. The full plan, with every locked design decision and the raw
data, lives in [`PLAN.md`](./PLAN.md).

Hosting is **GitHub Pages** (static export) and the backend is **Supabase**
(Google sign-in, Postgres with row level security, Storage). The plan was
originally written for Firebase; the roadmap is unchanged, only the plumbing.

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Scaffold, design tokens, fonts, data files, validator | done |
| 1 | Louvain communities + flat graph render | done |
| 2 | Semi-3D scene: fog, shadows, custom nodes, idle drift | done |
| 3 | Hover highlight, mobile 2D fallback, `/people` list | done |
| 4 | Google sign-in via Supabase + account claiming, login gate | done in code, needs the Supabase project (see below) |
| 5 to 9 | Profiles, homework, GPA, events, lore | not started |
| 10 | Privacy page, delete account, a11y audit | partly (noindex + robots.txt already in) |

Until the two Supabase variables are set at build time the site runs in
**"sign-in not connected"** mode: nothing is gated, `/login` explains the
situation, and everything else behaves exactly as before. Set the variables and
every page except `/login` and `/privacy` asks for a Google account that is on
the roster.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
npm run lint
npm run typecheck
```

Copy `.env.example` to `.env.local` to run with sign-in locally. To preview the
GitHub Pages build (served under `/2030-Projects/`), build with
`NEXT_PUBLIC_BASE_PATH=/2030-Projects` and serve `out/` under that prefix.

## Data pipeline

The roster and connection list are committed JSON, not database rows.

```bash
npm run data:validate      # 39 unique ids, weights in [0,5], no duplicate pairs
npm run data:communities   # runs Louvain, writes data/communities.json (commit it)
npm run data:import        # re-parses the Data Appendix in PLAN.md into data/*.json
npm run data:seed-sql      # writes supabase/seed.sql (id + email per person) from people.json
```

Louvain is seeded and run with `randomWalk: false` so the same input always
gives the same groups. Re-run `data:communities` only when the connection data
changes, then commit the new `communities.json`.

### The privacy rule

Weight 0 ("Hate") and weight 1 ("Don't know each other") edges feed the Louvain
math and nothing else. Every user-visible number comes from
`visibleConnections` in `src/lib/graphData.ts`, which is filtered to weight 2
and up. Do not read `connections` directly from UI code.

## Layout

```
data/            people.json, connections.json, communities.json (generated)
scripts/         import-connections, validate-data, compute-communities, generate-tokens
supabase/        migrations/ (people table, RLS, claim_person()), seed.sql (generated)
.github/workflows/deploy.yml   build + deploy to GitHub Pages on every push to the default branch
src/lib/         designTokens (single source of truth for colors), graphData, graphTheme, louvainColors
                 supabase (client + PersonRow), auth (AuthProvider, useAuth, claiming), basePath
src/components/auth/
  AuthGate.tsx           route-level login gate (transparent while Supabase is unconfigured)
  AccountMenu.tsx        header sign-in / name / sign-out
  NotOnRoster.tsx        screen for a Google account whose email is not in people.json
src/components/graph/
  GraphSceneClient.tsx   client boundary; picks 2D on phones, 3D elsewhere
  FriendGraphCanvas.tsx  the shared reagraph canvas
  PersonNode.tsx         custom node: pastel sphere, shadow, initials face, name label
  DepthFog.tsx           camera-relative fog for depth on a light background
  useIdleDrift.ts        slow auto-orbit that pauses on interaction
  useEgoHighlight.ts     hover dims non-neighbors to 40%
src/app/         / (map), /people (keyboard list), /profile/[personId] (stub), /login
```

Colors live once, in `src/lib/designTokens.ts`. `npm run tokens` (run
automatically before dev and build) writes them to `src/styles/tokens.css`
for Tailwind; the WebGL scene imports the same file directly.

## Deploying to GitHub Pages

1. Repo **Settings > Pages > Source: GitHub Actions**. That is the whole setup.
2. Every push runs `.github/workflows/deploy.yml` (validate, lint, typecheck,
   build). Pushes to the default branch also deploy `out/`.
3. The workflow sets `NEXT_PUBLIC_BASE_PATH=/<repo-name>` so the app works at
   `https://<user>.github.io/<repo-name>/`. A user site (`<user>.github.io`) or
   a `public/CNAME` custom domain gets an empty base path automatically.

Things GitHub Pages cannot do that Firebase Hosting could: no custom headers
(so no `X-Robots-Tag`; the `noindex` meta tag on every page still does the
job), and `robots.txt` only counts at the domain root, which a project site is
not. Both are fine because the meta tag is what search engines honour.

## Hooking up Supabase (turns Phase 4 on)

1. Create a Supabase project. In **Authentication > Providers** enable Google.
   Use your own Google Cloud OAuth client (consent screen in **Testing**, add
   all 39 emails as test users) and paste its client id/secret into Supabase.
2. **Authentication > URL Configuration**: set Site URL to the Pages URL and add
   `https://<user>.github.io/<repo-name>/login/` (and
   `http://localhost:3000/login/`) to Redirect URLs.
3. **SQL editor**: run `supabase/migrations/20260917000000_people.sql`, then
   fill the `email` field for each person in `data/people.json`, run
   `npm run data:seed-sql`, and run the generated `supabase/seed.sql`.
   Re-run both seed steps whenever an email changes; it is an upsert.
4. Repo **Settings > Secrets and variables > Actions > Variables**: add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon key
   is public by design; row level security is what protects data). Locally,
   put the same two in `.env.local`. Push, and sign-in is live.

How claiming works: on first login the app calls the `claim_person()` database
function, which links the Google account (`auth.uid()`) to the one unclaimed
`people` row whose email matches the account's email. Owners can then update
only their own `bio` and `photo_url` (enforced by RLS plus column grants);
`email`, `owner_uid` and `is_admin` are never writable from the browser.

## Search engines

`public/robots.txt` disallows everything, every page carries a `noindex`
meta tag, and Firebase Hosting adds an `X-Robots-Tag` header. Keep it that way.
