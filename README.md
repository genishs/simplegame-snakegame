# simplegame-snakegame

A small, cozy snake game built as a study project. Plain HTML + Canvas + JS — no build step. Deployed to GitHub Pages on every push to `main`.

▶ **Play:** https://genishs.github.io/simplegame-snakegame/

---

## Table of contents
- [About](#about)
- [Play](#play)
- [Controls](#controls)
- [Running locally](#running-locally)
- [Project layout](#project-layout)
- [Versioning roadmap](#versioning-roadmap)
- [Team & process](#team--process)
- [Documents](#documents)
- [Contributing](#contributing)

## About

This is a study project that grows incrementally from `v0.1` to `v1.0`. The version curve is intentional:

- **v0.1 – v0.2** — bare-bones playable snake, deployment proven on GitHub Pages
- **v0.3 – v0.x** — gameplay slices land one version at a time (stages, visuals, sound, etc.)
- **v1.0** — reached *only* when the **아기자기 (cute, cozy)** graphic identity feels finished

The game targets a calm, friendly tone. Early stages are deliberately easy; difficulty ramps later.

## Play

Open the live site and press **Space** to start.

## Controls

| Key | Action |
|---|---|
| ← → / A D | Turn left / Turn right |
| Space | Start / Pause / Restart |
| Esc | Skip tutorial (only on the tutorial stage) |
| 1 / 2 | 시작 화면에서 튜토리얼 / 바로 시작 선택 |

Your best score is stored in `localStorage` under the key `snake-best`.

## Running locally

There is no build step. Just open `index.html` in any modern browser:

```sh
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Or serve it with any static server if you want to test on a phone over LAN:

```sh
python -m http.server 8000
# then visit http://localhost:8000
```

## Project layout

```
.
├── index.html              # Page shell
├── style.css               # Visual styling (cozy palette)
├── game.js                 # Game loop, state, rendering
├── VERSION                 # Current version (single source of truth)
├── HISTORY.md              # Full version history with rationale
├── README.md               # This file
├── .github/workflows/
│   └── deploy.yml          # Builds and publishes to GitHub Pages
└── docs/
    ├── HARNESS.md          # Team structure & responsibilities
    ├── WORKFLOW.md         # Branch strategy, PR flow, release process
    ├── design/STYLE.md     # Design tokens & "아기자기" style guide
    └── specs/v0.X.md       # Per-version functional specs
```

## Versioning roadmap

Versions advance one slice at a time. The number is bumped in three places per version: `VERSION`, the `v0.X` string in `index.html`, and the `HISTORY.md` heading.

| Version | Focus | Status |
|---|---|---|
| v0.1 | Initial canvas game + Pages deploy | ✅ |
| v0.2 | Deployment + play-through verified | ✅ |
| v0.3 | Cute snake graphic eating an apple | ✅ |
| v0.4 | 5×5 tutorial stage, first "Stage" concept | ✅ |
| v0.5 | Tutorial: slower, non-punishing, skippable | ✅ |
| v0.5.1 | Difficulty tuning + Stage 2/3 data | ✅ |
| v0.5.2 | Connected snake body + egg-shape head + eat squash | ✅ |
| v0.5.3 | Digestion bulge flowing head → tail | ✅ |
| v0.5.4 | Left/right rotation input + mobile portrait controls | ✅ |
| v0.5.5 | Hotfix: canvas tap fallback + BLOCKED recovery + media query relaxation | ✅ |
| v0.5.6 | Tutorial choice screen + 3-2-1 countdown | ✅ |
| v0.5.7 | UI scaling, difficulty curve, Korean UI, wiggle, help screen | ✅ |
| v0.6+ | Full-board clear mechanic + Stage 4–5 data | — |
| v1.0 | Cozy graphic identity complete | reserved |

See `HISTORY.md` for the full ledger.

## Team & process

Work is organized through four parts. Each part has a Lead (architecture/decisions) and a teammate (execution):

| Part | Lead | Teammate |
|---|---|---|
| Planning | `planning-lead` | `planner` |
| Development | `dev-lead` | `developer` |
| Design | `design-lead` | `designer` |
| SCM | `scm-lead` | `scm` |

Detailed responsibilities and the collaboration flow live in [`docs/HARNESS.md`](docs/HARNESS.md).

The branch and PR flow lives in [`docs/WORKFLOW.md`](docs/WORKFLOW.md). Short version: development happens on `feature/v0.X-<slug>` branches; SCM teammate reviews; SCM Lead merges to `main`; Pages deploys automatically.

## Documents

- [`HISTORY.md`](HISTORY.md) — version history with rationale
- [`docs/HARNESS.md`](docs/HARNESS.md) — team structure, who decides what
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — branches, PRs, releases, deploy
- [`docs/design/STYLE.md`](docs/design/STYLE.md) — design tokens, "아기자기" palette and motion (added with v0.3)
- [`docs/specs/`](docs/specs/) — per-version specs

## Contributing

1. Read `docs/WORKFLOW.md`
2. Create a branch: `git checkout -b feature/v0.X-<slug>`
3. Make focused commits; update `VERSION`, the page version string, and `HISTORY.md`
4. `gh pr create` targeting `main`; reference the spec in the PR body
5. SCM teammate reviews; SCM Lead merges and tags
