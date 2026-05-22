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
| `--mask-outside` | `rgba(120, 90, 60, 0.18)` | Area outside the active stage (tutorial spotlight) |
| `--stage-label` | `#8a7460` | "Stage: ..." HUD label color |

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
| `--eat-squash-x` | `1.18` | Eat squash horizontal scale peak (v0.5.2) |
| `--eat-squash-y` | `0.88` | Eat squash vertical scale trough (v0.5.2) |
| `--eat-squash-dur` | `180ms` | Squash & stretch duration, runs concurrently with `--eat-pulse-dur` (v0.5.2) |
| `--sparkle-color` | `#fff4b8` | Optional sparkle tint (warm cream-yellow); reserved, not used as primary in v0.5.2 |
| `--sparkle-count` | `3` | Sparkle dot count if used as secondary |
| `--sparkle-radius` | `1.2px` | Sparkle dot radius |
| `--sparkle-dur` | `220ms` | Sparkle fade duration |

## Snake illustration spec

- Body segment: rounded rectangle with `--radius-cell`, filled with `--snake-body`, with an inner shadow (1px down, `--snake-shadow`)
- Head segment: same shape filled with `--snake-head`; on the leading face, two white circles (radius 2.5px) with smaller black pupils (radius 1.2px). Eye placement rotates with direction so the snake is always facing the way it's moving.

> **Note:** The above is the v0.3/v0.4 spec. v0.5.2 supersedes the snake rendering with a connected body and a distinct head. See the next section.

## Snake illustration spec — v0.5.2 (connected body + distinct head)

The snake is no longer drawn as discrete squares. The body is a single continuous shape that bends smoothly through corners, and the head is rendered as a separate ellipse with a face.

### Set A — Head

| Token | Value | Reason |
|---|---|---|
| `--head-shape` | `ellipse` | Egg-shaped silhouette reads more "animal," less "tile." Snakes have elongated heads, not perfect circles. |
| `--head-length` | `--cell` × 1.10 | Slightly longer than a cell along the facing axis so the head visually leads the body. |
| `--head-width` | `--cell` × 0.92 | Slightly narrower than a cell across the facing axis, reinforcing the egg shape. |
| `--head-fill` | `--snake-head` | Keep existing sage-green head tone (continuity with v0.3). |
| `--head-eye-radius` | `2.5px` | Same as v0.3 — already feels right for 20px cells. |
| `--head-eye-offset-forward` | `--cell` × 0.18 | Eyes sit forward on the head, not centered, so the face has a clear "front." |
| `--head-eye-offset-side` | `--cell` × 0.22 | Side-by-side spacing for two eyes flanking the centerline. |
| `--head-pupil-radius` | `1.2px` | Same as v0.3. |
| `--head-pupil-color` | `#2a2018` | Soft near-black (matches `--text-strong` family, never pure `#000`). |
| `--head-mouth` | `tongue-tip only` | Decision: **pink tongue tip only, no open mouth.** A faint forked tongue-tip is cuter and less aggressive than an open mouth; cozy snakes don't gape. |
| `--head-tongue-color` | `#ef9aa6` | Soft warm pink, harmonizes with `--apple-body`. |
| `--head-tongue-length` | `3px` | Just a peek — extends from front of head along facing direction. |
| `--head-tongue-visibility` | `idle flicker, every 1600ms for 120ms` | Subtle life sign, never frantic. |
| `--head-rotation` | `direction vector` | Continue v0.3 behavior — rotate head sprite by the head's current `(dx, dy)` direction. No interpolation between ticks. |

Sources of cute: forward eyes + occasional tongue flick. No eyebrows, no cheeks — the silhouette does the work.

### Set B — Body curve technique

| Token | Value | Reason |
|---|---|---|
| `--body-technique` | `capsule stroke` | **Chosen.** A single `ctx.stroke()` along a polyline through every body-segment center, with `lineWidth = --body-thickness`, `lineCap = round`, `lineJoin = round`. One stroke per snake = O(N) cheap, no path triangulation, no fill self-intersection issues. |
| Rejected: path fill | — | A filled outline path would need both sides of the body computed and joined cleanly — fragile at sharp bends and 2–3× more vertex work for no visible gain at 20px cell scale. |
| `--body-thickness` | `--cell` × 0.86 | Slightly inset from cell edges so the body reads as a tube inside the grid, not as filling tiles. Matches the "1px padding" cozy rule used for apples. |
| `--body-fill` | `--snake-body` (stroke color) | Continuity. |
| `--body-linecap` | `round` | Makes the tail end naturally rounded with zero extra code. |
| `--body-linejoin` | `round` | Together with `quadraticCurveTo` at corners, eliminates visible cell-boundary kinks. |
| `--body-smoothing` | `quadraticCurveTo at every interior point` | Each interior segment center is used as the control point of a quadratic curve from the midpoint of the previous edge to the midpoint of the next edge — classic Catmull-Rom-lite. Cheap and visually smooth. |
| `--body-gradient` | `none in v0.5.2` | Keep body a single solid `--snake-body`. The head is a separate ellipse in `--snake-head`, so the two-tone identity from v0.3 is preserved without needing a per-segment gradient. Defer per-length gradient to v0.6+. |
| `--body-shadow` | `--snake-shadow`, offset y +1px, drawn as a second wider stroke first | Cheap depth without a real shadow pass. |

Reason for capsule stroke (one-liner): one stroke call per snake, geometry is just N points, and `lineJoin=round` already solves 80% of the smoothing problem before any curve math.

### Set C — Corner curves

| Token | Value | Reason |
|---|---|---|
| `--corner-radius` | `--cell` × 0.50 | Half a cell — the curve passes through the cell center and exits at the two adjacent edge midpoints. Visually unambiguous as a quarter-arc, never overshoots into the neighbor cell. |
| `--corner-detection` | `(prev.dx, prev.dy) != (next.dx, next.dy)` | A cell is a corner iff the incoming direction differs from the outgoing direction. Computed once per render by walking the body once (O(N)). |
| `--corner-implementation` | `quadraticCurveTo(cellCenter, edgeMidpointOut)` | Control point = cell center; endpoint = midpoint of the edge shared with the next cell. The previous `lineTo` already ends at the midpoint of the edge shared with the previous cell. This naturally produces a quarter-arc of radius `--cell` × 0.5 with no trig. |
| `--corner-tail-handling` | `tail cell does NOT round` | The last segment terminates with a straight `lineTo` to the tail center, then `round` linecap finishes it. Rounding the tail-adjacent corner caused a visible "pinch" in prototyping. The second-to-last segment IS still allowed to round if it's a corner. |
| `--corner-head-handling` | `head is drawn separately` | The body polyline ends one cell behind the head; the head ellipse covers the join. So the head-adjacent corner is always hidden under the head sprite — no special case needed. |

### Set D — Eat motion reinforcement

| Token | Value | Reason |
|---|---|---|
| **Primary** | `squash & stretch on head` | Squash communicates "bite" with body language — readable even with sound off, harmonizes with the existing pulse, and costs only a `ctx.scale()` on the already-transformed head. |
| **Secondary** | `sparkle (reserved, OFF by default in v0.5.2)` | Tokens defined for future use, but the v0.5.2 dev brief should ship squash-only. Adding sparkles on top risks "frantic," which violates the cozy rule. |
| `--eat-squash-x` | `1.18` | Stretches along facing direction as the head "lunges" into the apple. |
| `--eat-squash-y` | `0.88` | Squashes perpendicular to facing direction. Product (1.18 × 0.88 ≈ 1.04) keeps roughly conserved area so the head doesn't visibly grow. |
| `--eat-squash-dur` | `180ms` | Slightly longer than `--eat-pulse-dur` (150ms) so squash decays just after pulse — gives a soft "settle" feel rather than a hard snap. |
| Easing | `ease-out → ease-in` | Fast lunge, slow return. Same shape as pulse so they read as one motion. |
| Concurrency | `runs in parallel with --eat-pulse-*` | Pulse handles size, squash handles shape. They compose multiplicatively on the head transform. |

If sparkles are ever turned on (v0.6+ candidate): `--sparkle-count` dots at random angles around the apple's last position, each fading from `--sparkle-color` over `--sparkle-dur` with radius `--sparkle-radius`. Reserved tokens above.

### Performance budget (60fps check)

- Body polyline: 1 `beginPath` + N `lineTo`/`quadraticCurveTo` + 1 `stroke`. At max practical length 60, that's ~60 path commands plus one stroke per frame — well under the 1ms budget on any RAF-driven canvas at 400×400.
- Head: 1 ellipse + 2 eye circles + 2 pupil circles + (occasionally) 1 tongue path. ~6 draw calls per frame, constant.
- Corner detection: single O(N) walk during the same render pass that builds the polyline — no separate pass, no allocation per frame (reuse a single point array sized to max snake length at game start).
- Eat motion: pure transform math, no extra draws.
- Verdict: comfortably under frame budget at 60fps. No path caching needed for v0.5.2.

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

## Stage spotlight (v0.4+)

When the active stage uses a smaller logical grid than the canvas (tutorial = 5×5 on a 20-cell canvas), the inactive cells are dimmed with `--mask-outside` so the active play area visually pops without changing canvas dimensions. The active area still uses `--bg-board`; the mask is a single overlay rectangle drawn AFTER the background and BEFORE the grid lines of the active area, so grid lines exist only inside the active area.

## What this version intentionally does NOT include

- No particle effects on eat (parked for later — sparkle tokens reserved, OFF in v0.5.2)
- No trail/afterimage on snake (parked)
- No background pattern besides the subtle grid (parked)
- No facial expression changes on death (parked — could be a nice v0.x touch)
- **No digestion animation** (food traveling along the body) — explicitly deferred to v0.5.3, NOT in v0.5.2 scope
- No per-length body gradient — defer to v0.6+; v0.5.2 keeps the body a solid `--snake-body` and relies on the separate head ellipse for two-tone identity

## Stage visual rule

Stages 1–3, when they arrive, MUST use this palette and motion profile exactly. Visual difficulty cues (cooler/darker palette, denser grid, obstacles) only appear from stage 4 onward. This is a hard user-set rule.
