# Class of 2030 friend map

A private site for one grade at ISY. The landing page runs Louvain community
detection over a self-collected friendship dataset (39 people, every pair
rated 0 to 5) and draws it as a semi-3D map colored by detected friend group.
Later phases add profiles, a homework tracker, a private GPA tracker, events,
and a lore wall. The full plan, with every locked design decision and the raw
data, lives in [`PLAN.md`](./PLAN.md).

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Scaffold, design tokens, fonts, data files, validator | done |
| 1 | Louvain communities + flat graph render | done |
| 2 | Semi-3D scene: fog, shadows, custom nodes, idle drift | done |
| 3 | Hover highlight, mobile 2D fallback, `/people` list | done |
| 4 | Firebase Auth (Google) + account claiming | next |
| 5 to 9 | Profiles, homework, GPA, events, lore | not started |
| 10 | Privacy page, delete account, a11y audit | partly (noindex + robots.txt already in) |

Firebase is **not wired up yet**. `firebase.json`, `.firebaserc` and both rules
files are committed and ready; the project id and web app keys still need to be
created in the Firebase console (see "Before Phase 4" below).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
npm run lint
npm run typecheck
```

## Data pipeline

The roster and connection list are committed JSON, not database rows.

```bash
npm run data:validate      # 39 unique ids, weights in [0,5], no duplicate pairs
npm run data:communities   # runs Louvain, writes data/communities.json (commit it)
npm run data:import        # re-parses the Data Appendix in PLAN.md into data/*.json
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
src/lib/         designTokens (single source of truth for colors), graphData, graphTheme, louvainColors
src/components/graph/
  GraphSceneClient.tsx   client boundary; picks 2D on phones, 3D elsewhere
  FriendGraphCanvas.tsx  the shared reagraph canvas
  PersonNode.tsx         custom node: pastel sphere, shadow, initials face, name label
  DepthFog.tsx           camera-relative fog for depth on a light background
  useIdleDrift.ts        slow auto-orbit that pauses on interaction
  useEgoHighlight.ts     hover dims non-neighbors to 40%
src/app/         / (map), /people (keyboard list), /profile/[personId] (stub)
```

Colors live once, in `src/lib/designTokens.ts`. `npm run tokens` (run
automatically before dev and build) writes them to `src/styles/tokens.css`
for Tailwind; the WebGL scene imports the same file directly.

## Before Phase 4 (Firebase)

1. Create a Firebase project. Enable Authentication (Google provider only),
   Firestore (production mode), Storage and Hosting.
2. In Google Cloud console, keep the OAuth consent screen in **Testing** and add
   all 39 emails as test users.
3. Put the project id in `.firebaserc` and the web app keys in `.env.local`
   (template in `.env.example`).
4. Fill in the `email` field for each person in `data/people.json`. It is the
   join key for claiming a profile on first login.
5. `npx firebase-tools deploy --only firestore:rules,storage:rules`.

## Search engines

`public/robots.txt` disallows everything, every page carries a `noindex`
meta tag, and Firebase Hosting adds an `X-Robots-Tag` header. Keep it that way.
