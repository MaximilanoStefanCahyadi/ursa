# ursa — an outer-space museum

A portfolio site styled as a night-sky museum. Each project is a glowing star on
an open sky map; same-category stars form constellations, and cross-category
stars that share 2+ technologies are linked with faint dashed lines. Clicking a
star opens its museum placard.

Built with React + Vite + Three.js (react-three-fiber). No database.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Add a project

Adding a project takes exactly two steps:

1. Add one entry to `src/data/projects.json` under `"projects"`:

```json
{
  "id": "my-project",
  "title": "My Project",
  "dates": "2026",
  "status": "live",
  "category": "IoT",
  "shortDescription": "One-liner shown on the placard.",
  "story": "Longer story.",
  "funFacts": ["..."],
  "techStack": ["Python"],
  "links": { "live": "", "github": "" },
  "screenshot": "/screenshots/projects/my-project.png"
}
```

2. Drop the screenshot into `public/screenshots/projects/`.

Star position, constellation lines, colors, and the legend are all derived
automatically from `dates`, `category`, and `techStack`. `status: "ongoing"`
(or "Present" in `dates`) makes the star pulse. A missing screenshot renders a
graceful placeholder — nothing breaks.

## Test

With the dev server running:

```bash
node tests/e2e.mjs
```

## Deploy (Vercel via GitHub)

1. Push this repo to GitHub.
2. On vercel.com: **Add New → Project → Import** the repo. Vercel auto-detects
   Vite (build `npm run build`, output `dist/`). No env vars needed.
3. Every `git push` to `main` deploys automatically.

## Roadmap

- **Phase 1 — done:** constellation sky, zoom/pan with inertia, hover tooltips,
  museum placard modal, pulsing in-progress stars.
- **Phase 2 — done:** animated constellation/period filter with smooth dimming,
  experience-constellation layer toggle with its own placard variant.
- **Phase 3 — done:** "Enter Gallery" warp transition into a first-person
  rotunda gallery (WASD + pointer lock, one wall per project, PBR frames,
  per-painting spotlights, soft shadows, reflective floor, ACES tone mapping).
  Aiming at a painting and clicking opens the full inspect overlay with story,
  fun facts, tech, and links. The rotunda grows automatically with the JSON.
