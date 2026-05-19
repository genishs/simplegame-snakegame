# Style guide — 아기자기 (cute, cozy)

The single source of truth for every visual decision. If a value isn't in this file, it shouldn't appear in `style.css` or `game.js`.

## Tone

Calm. Friendly. A little bit warm. Not aggressive, not arcadey. Pastel over saturated, rounded over sharp.

## Palette

| Token | Hex | Role |
|---|---|---|
| `--bg-page` | `#fdf6ec` | Page background (warm cream) |
| `--bg-board` | `#fff4dc` | Canvas board background (soft butter) |
| `--grid-line` | `rgba(120, 90, 60, 0.06)` | Subtle grid lines on the board |
| `--border-board` | `#e6c9a3` | Canvas border (warm tan) |
| `--text-strong` | `#3b2a1a` | HUD numerics, titles |
| `--text-muted` | `#8a7460` | Hints, secondary text |
| `--accent` | `#f4a261` | HUD accents (warm orange) |
| `--snake-body` | `#7cc47c` | Snake body (soft sage green) |
| `--snake-head` | `#6bb96b` | Snake head (one shade richer) |
| `--snake-shadow` | `rgba(60, 100, 60, 0.18)` | Inner shadow on segments |
| `--apple-body` | `#ef6f6c` | Apple red (warm coral, not fire) |
| `--apple-highlight` | `rgba(255, 255, 255, 0.55)` | Apple gloss |
| `--apple-leaf` | `#7ac74f` | Apple leaf (slightly brighter green) |
| `--apple-stem` | `#5d3a1c` | Apple stem (warm brown) |

## Geometry tokens

| Token | Value | Use |
|---|---|---|
| `--radius-cell` | `5px` | Snake segment corner radius |
| `--radius-ui` | `12px` | Panels, overlay card, buttons (if any) |
| `--cell` | `20px` | Logical cell size on canvas (unchanged from v0.1) |

## Motion tokens

| Token | Value | Use |
|---|---|---|
| `--wobble-period` | `1200ms` | Idle apple wobble cycle |
| `--wobble-amp` | `1.5px` | Idle apple wobble amplitude |
| `--eat-pulse-dur` | `150ms` | Head pulse when eating an apple |
| `--eat-pulse-scale` | `1.10` | Head pulse peak scale |

## Snake illustration spec

- Body segment: rounded rectangle with `--radius-cell`, filled with `--snake-body`, with an inner shadow (1px down, `--snake-shadow`)
- Head segment: same shape filled with `--snake-head`; on the leading face, two white circles (radius 2.5px) with smaller black pupils (radius 1.2px). Eye placement rotates with direction so the snake is always facing the way it's moving.

## Apple illustration spec

Composed entirely from canvas primitives — no external image:
1. **Body:** filled circle, radius ≈ `--cell` × 0.42, color `--apple-body`
2. **Highlight:** smaller ellipse top-left at 35% opacity, color `--apple-highlight`
3. **Stem:** 1.5px × 3px rectangle, color `--apple-stem`, top-center
4. **Leaf:** small leaf shape (two arcs) to the right of the stem, color `--apple-leaf`

The whole apple sits inside the cell with ~1px padding so it reads as a friendly object, not a tile fill.

## Motion behavior

- **Idle apple wobble:** the apple's center y oscillates by `--wobble-amp` over `--wobble-period` using a sine curve. Continuous, never resets between frames.
- **Eat pulse:** when the snake's head lands on the apple, the head segment scales up to `--eat-pulse-scale` over half the duration, then back to 1.0 over the other half (ease-in-out). The body does not pulse.
- **Background:** static. No motion. Cozy means calm — the board itself should not move.

## What this version intentionally does NOT include

- No particle effects on eat (parked for later)
- No trail/afterimage on snake (parked)
- No background pattern besides the subtle grid (parked)
- No facial expression changes on death (parked — could be a nice v0.x touch)

## Stage visual rule

Stages 1–3, when they arrive, MUST use this palette and motion profile exactly. Visual difficulty cues (cooler/darker palette, denser grid, obstacles) only appear from stage 4 onward. This is a hard user-set rule.
