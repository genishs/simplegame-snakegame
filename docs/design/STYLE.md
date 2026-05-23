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

## Digestion bulge spec — v0.5.3 (apple traveling down the body)

Purely visual: when the snake eats an apple, a small ellipse "bulge" appears on the head and flows along the body polyline to the tail, then fades out. Game logic is unchanged — growth still happens instantly on the same tick the apple is consumed. The bulge is a cozy visual receipt, never a gameplay signal.

### Tokens

| Token | Value | Reason |
|---|---|---|
| `bulgeFlowSpeed` | `2.0` cells/sec (= 500ms per cell) | Slow enough to be readable and calm; matches Planning's recommended pace. Faster than this starts to feel "frantic," slower feels stuck. |
| `bulgeMaxScale` | `0.80` | Starting bulge size as a fraction of the head ellipse's short axis. 0.80 reads as "the snake just swallowed something noticeable" without overpowering the head silhouette. |
| `bulgeMinScale` | `0.60` | Bulge shrinks as it travels — visually says "being digested." Floor of 0.60 keeps the bulge still visible at the tail (below ~0.5 it disappears into the body thickness). |
| `bulgeFadeMs` | `200` | Once the bulge reaches the tail point, it fades out over 200ms. Same order as `--eat-squash-dur` (180ms) so the entire eat→digest→done arc reads as one soft motion sequence. |
| `bulgeFill` | `#d76461` | `--apple-body` (`#ef6f6c`) with each RGB channel scaled to ~90% — hue preserved, value dropped ~10%. Reads as "the apple, slightly darker because it's inside the snake now." |
| `bulgeAspect` | `1.15 : 1.0` (length : width, oriented along the body) | Slightly elongated along the direction of travel — matches the body's tube silhouette and reads as a peristaltic lump, not a floating dot. Length axis = body tangent at the bulge's current point; width axis = perpendicular to body, capped at `--body-thickness` × 0.95 so it never spills outside the body stroke. |
| `bulgeMaxConcurrent` | `8` | Cap on simultaneous active bulges. Eating 8+ apples within 4 seconds is rare; the cap exists to bound the per-frame draw cost and avoid array growth on edge cases. Excess bulges are dropped silently (visual only, no gameplay impact). |

### Position interpolation

Bulges share the body's geometry exactly. Each bulge stores a `progress` value in arc-length units along the same polyline the body stroke is drawn from. Per frame:

1. Advance `progress += bulgeFlowSpeed × cell × dt` (in pixels).
2. Walk the body polyline segments to find the segment containing `progress`.
3. Within a straight segment: **linear interpolation** between the two endpoints.
4. Within a corner cell: use the **same `quadraticCurveTo` control point** the body uses (`--corner-implementation`), and evaluate the quadratic Bezier at the local `t`. This reuses the existing corner math — no new curve type — so the bulge tracks the body exactly through bends, never cutting the corner or floating outside the stroke.

Tangent direction at the bulge's current point is the derivative of the same curve (straight segment direction, or Bezier derivative at `t` in corners). Used to orient the ellipse's long axis.

### Scale interpolation

`scale = lerp(bulgeMaxScale, bulgeMinScale, progressFraction)` where `progressFraction = travelledArcLength / totalBodyArcLength` at the moment of the bulge's spawn (snapshot at spawn so a growing snake doesn't retroactively stretch the curve). Linear lerp — eased curves felt over-designed in mental simulation; linear reads as steady digestion.

### Fade behavior

On reaching the tail point, the bulge enters fade state:
- **Alpha only** fades from 1.0 → 0.0 over `bulgeFadeMs` (linear).
- **Scale is held** at `bulgeMinScale` during fade — shrinking AND fading simultaneously looked "vanishing into thin air," whereas alpha-only reads as "absorbed."
- No sparkle, no secondary effect (per Planning).

### Drawing order per frame

1. Body shadow stroke (existing)
2. Body main stroke (existing)
3. **Bulge ellipses** (new, drawn on top of body stroke, under head)
4. Head ellipse + face (existing)
5. Apple, HUD (existing)

Bulges over body, under head — so when a fresh bulge spawns on the head it appears to emerge from underneath the head rather than overlapping it.

### Performance budget (60fps check)

Per frame added cost: up to 8 bulges × (1 polyline walk to find segment + 1 ellipse + 1 fill) ≈ 24 draw calls worst case, plus 8 short arc-length walks (each bounded by snake length / 8 on average). At max snake length 60 and 8 bulges this is ~80 extra arithmetic ops and 24 draw calls per frame — well inside the remaining frame budget after the v0.5.2 body+head cost. **No performance risk at 60fps.**

Payload impact: estimated +1.5–2.0KB in `game.js` (one small array, one update loop, one draw loop, one helper for Bezier point+tangent). Current 18.9KB → projected ~20.5–21.0KB, comfortably under the 50KB cap.

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
- ~~**No digestion animation** (food traveling along the body) — explicitly deferred to v0.5.3, NOT in v0.5.2 scope~~ **Landed in v0.5.3** — see "Digestion bulge spec" section above.
- No per-length body gradient — defer to v0.6+; v0.5.2 keeps the body a solid `--snake-body` and relies on the separate head ellipse for two-tone identity

## Stage visual rule

Stages 1–3, when they arrive, MUST use this palette and motion profile exactly. Visual difficulty cues (cooler/darker palette, denser grid, obstacles) only appear from stage 4 onward. This is a hard user-set rule.

## v0.5.4 Mobile/Touch

Input model changes for v0.5.4: arrow keys are replaced with **left/right rotation only** on all platforms (desktop and mobile). Mobile portrait orientation adds three on-screen buttons. Mobile landscape and desktop hide the buttons and accept rotation via keyboard (Left/Right arrow or A/D) and via pointer clicks on the canvas (left half = rotate left, right half = rotate right). All visual tokens from v0.5.2/v0.5.3 (`--snake-body`, `--apple-body`, body capsule, bulge, etc.) are unchanged.

### Definition of "mobile" (single source of truth)

```css
@media (max-aspect-ratio: 1/1) and (hover: none) and (pointer: coarse) { /* mobile portrait — show bottom buttons */ }
```

- `(max-aspect-ratio: 1/1)` → portrait or square (height ≥ width). Landscape (`min-aspect-ratio: 1/1`) hides buttons regardless of device.
- `(hover: none) and (pointer: coarse)` → primary input is touch. Excludes desktops in a narrow portrait window (they keep keyboard).
- This combined query is the **only** branch point. No `max-width` breakpoint — width alone over-fires on resized desktop windows and under-fires on tablets in portrait.

For canvas viewport fit (always-on, not behind the media query): the canvas keeps its 400×400 pixel buffer; CSS sizes it with `width: min(100vw - 32px, 100vh - var(--mobile-controls-reserve), 400px)` and `aspect-ratio: 1 / 1`. On desktop and mobile landscape `--mobile-controls-reserve` is `0px`; in the mobile media query above it becomes `var(--mobile-controls-height) + var(--canvas-mobile-gap) + 32px` so the canvas never overlaps the button strip.

### 1. Mobile button tokens

| Token | Value | Reason |
|---|---|---|
| `--mobile-rotate-btn-size` | `72px` | Large primary action. Comfortably above the 44px accessibility minimum, and large enough that two thumbs hitting left/right at speed never miss. 72px also matches the visual weight of the snake head at default zoom, keeping the buttons proportionate to the game. |
| `--mobile-aux-btn-size` | `52px` | Smaller secondary action (Space toggle). Above 44px floor, but visibly subordinate to the rotate buttons so the eye reads "two primary, one auxiliary." |
| `--mobile-btn-radius` | `18px` | Rounded square (not full circle). Full circles compete with the apple's silhouette; rounded squares feel like "soft toys / wooden blocks," reinforcing 아기자기. `18px` is exactly `--mobile-rotate-btn-size / 4`, a calm proportion. |
| `--mobile-btn-bg-idle` | `#fff4dc` | Same as `--bg-board` — buttons read as "cut from the same cozy paper" as the play area. Not white, not gray. |
| `--mobile-btn-bg-pressed` | `#f4d9a8` | One step down toward `--border-board`. Warm, not muddy. Used during `:active` / `pointerdown`. |
| `--mobile-btn-bg-disabled` | `#f5ebd9` | Slightly desaturated cream. Used on the aux button when the game is in a state where Space has no effect (none currently, reserved). |
| `--mobile-btn-border` | `1px solid #e6c9a3` | Reuses `--border-board`. Single hairline keeps the button feeling like part of the world, not a UI chrome element. |
| `--mobile-btn-shadow` | `0 2px 0 #e6c9a3, 0 4px 10px rgba(120, 90, 60, 0.12)` | Two-layer: a 2px solid offset (gives the "pressable token" feel — like a wooden button sitting on the page) plus a soft long shadow for warmth. On `:active` the 2px offset collapses to `0 1px 0 ...` to create a tactile press. No neon glow, no inset blue ring. |
| `--mobile-btn-icon-color` | `#3b2a1a` | Reuses `--text-strong`. Same ink as HUD numerics — visual continuity. |
| `--mobile-btn-icon-size` | `36px` | Half the rotate button width. Leaves a generous ring of cream around each glyph so the button never feels cramped. |
| `--mobile-btn-gap` | `24px` | Generous spacing between the three buttons. Wide enough that a thumb landing between buttons unambiguously triggers nothing (avoids ghost-press), narrow enough to keep all three reachable in one hand on a 5.5" phone. |

**Icon representation: inline SVG (chosen over Unicode glyphs).**

Rationale: Unicode arrows (`↺` `↻` `▶` `⏸`) render inconsistently across Android/iOS system fonts — on some devices `↺` shows as a thin outline, on others a heavy emoji, and color cannot be controlled (emoji-rendered glyphs ignore `color:`). Inline SVG gives pixel-perfect control of stroke weight, corner roundness, and color via `currentColor`, and adds <1KB total. Each icon is a 24×24 viewBox stroked at `stroke-width="2.5"` with `stroke-linecap="round"` and `stroke-linejoin="round"` so the icon style matches the snake's `lineCap=round` body — same visual language.

Glyph set:
- **Left rotate:** circular arrow opening to the left (counter-clockwise arc with arrowhead at ~8 o'clock).
- **Right rotate:** mirrored — arrow opening to the right (clockwise arc with arrowhead at ~4 o'clock).
- **Aux (Space toggle):** swaps between play triangle `▶` and pause double-bar `⏸` shapes based on game state. Single toggle handles start/pause/restart per Planning-Lead's spec (1:1 with the spacebar). Idle state shows play triangle; running shows pause; game-over shows a small refresh-arrow variant of the play triangle (same SVG, rotated path) — all three states use the same `--mobile-aux-btn-size` and `--mobile-btn-radius` so the button never resizes.

### 2. Touch zone hint tokens

Shown on the IDLE screen only, before the player has issued any input. Two faint vertical bands (left half + right half of the canvas) hint at the tap-to-rotate zones. Disappears on first input of any kind (key, click, tap, button press).

| Token | Value | Reason |
|---|---|---|
| `--touch-zone-hint-alpha` | `0.08` | Right in the middle of the 0.06–0.10 recommended range. At 0.08 the bands are visible against `--bg-board` (`#fff4dc`) without competing with the snake or apple. Tested mentally against `--grid-line` alpha (0.06) — hint sits one notch above the grid so it reads as intentional, not as a darker grid cell. |
| `--touch-zone-hint-color` | `#c9a574` | A muted warm tan harmonizing with `--border-board` (`#e6c9a3`) but slightly deeper so it survives at 0.08 alpha. Painted as `rgba(201, 165, 116, 0.08)` in practice. Never gray or blue — must stay in the warm-cream family. |
| `--touch-zone-hint-divider` | `none` | No vertical line down the middle. Two soft bands meeting at the centerline read as "two halves" without a hard divider, which would feel clinical. |
| `--touch-zone-hint-fade-in` | `400ms ease-out` | Slow enough to feel like the hint is "settling in" after the IDLE screen appears, not popping on. Starts ~300ms after IDLE render so the player sees the cozy board first, then the hint gently arrives. |
| `--touch-zone-hint-fade-out` | `200ms ease-in` | Faster fade-out on first input — the player has signaled intent, so the hint should clear immediately but smoothly. |
| `--touch-zone-hint-label` | `optional, OFF by default` | Tokens reserved for tiny text labels ("회전 ←" / "회전 →") if user feedback requests them post-v0.5.4. Default v0.5.4 ship: bands only, no text. Cozy is calm; the IDLE overlay copy already explains controls. |

### 3. Responsive breakpoint summary

Single media query controls all mobile-specific layout (see "Definition of mobile" above). No other breakpoints exist. Specifically rejected:

- **`max-width: 600px`**: fires on resized desktop windows where the player still has a keyboard. Wrong audience.
- **`orientation: portrait`**: alone, fires on a Surface tablet in portrait mode that has a keyboard attached — same issue as max-width.
- **`pointer: coarse` alone**: fires on touchscreen laptops where users typically still prefer the keyboard. Combining with `hover: none` excludes those.

Canvas viewport fit (size-clamping the canvas to viewport) runs **outside** the media query and applies universally — desktop windows resized small also get the clamped canvas, just without the buttons. This means mobile landscape behaves identically to a small desktop window: canvas fits, no buttons, keyboard/pointer input only.

### 4. Bottom controls area tokens

| Token | Value | Reason |
|---|---|---|
| `--mobile-controls-height` | `128px` | Inside the recommended 120–140px range. Equals `--mobile-rotate-btn-size` (72) + `--mobile-controls-padding` × 2 (16 × 2) + a 24px safe-area bottom buffer for iOS home-indicator clearance. Tall enough that buttons sit comfortably, short enough to leave the canvas as the dominant element. |
| `--mobile-controls-padding` | `16px` | Inner padding on all sides of the controls strip. Matches the page-level breathing room and prevents buttons from butting against screen edges. |
| `--mobile-controls-bg` | `#fdf6ec` | Same as `--bg-page`. The controls area is not a separate panel — it's the same warm cream as the page, so the buttons appear to sit directly on the page surface. No card chrome. |
| `--mobile-controls-border-top` | `1px solid rgba(230, 201, 163, 0.5)` | Half-strength `--border-board` as a hairline divider between canvas and controls. Subtle enough that the eye barely registers it; just enough that the buttons feel "anchored" to a strip rather than floating. |
| `--mobile-controls-safe-area-bottom` | `env(safe-area-inset-bottom, 0px)` | iOS home indicator + Android gesture bar clearance. Added to the height calculation, not subtracted from padding, so the button row stays at constant visual position above the system UI. |
| `--canvas-mobile-gap` | `16px` | Gap between the canvas bottom edge and the top of the controls strip. Matches `--mobile-controls-padding` for visual rhythm. |
| `--mobile-controls-layout` | `flex, justify-content: center, align-items: center, gap: var(--mobile-btn-gap)` | Three buttons in a single centered row: `[rotate-left] [aux] [rotate-right]`. Aux button in the middle is intentional — it's the "neutral" action between the two directional actions, and matches the spacebar's central position on a keyboard. |

### Drawing order / layering on mobile

1. Page background (`--bg-page`)
2. Canvas (everything from v0.5.3 spec, unchanged)
3. **Touch zone hint bands** — drawn on canvas as the topmost canvas layer, only when game state is IDLE and no input has occurred yet
4. **Controls strip** — separate DOM element below the canvas, not part of the canvas; uses HTML buttons with inline-SVG icons for accessibility (real focusable buttons, real `aria-label`s, real `:active` states)

The controls strip being DOM (not canvas) means screen readers see real buttons and the OS provides haptic feedback on press where supported — zero extra code on our side.

### Payload check

Estimated additions:
- CSS for buttons + media query + controls strip: ~1.2KB
- Inline SVG icons (3 × ~120 bytes): ~0.4KB
- JS for pointer→rotation handler, button event wiring, hint fade: ~1.5KB

Total estimated: ~3.1KB. Current 21KB → projected ~24KB, well under the 50KB cap.

### What v0.5.4 intentionally does NOT include

- **No swipe gestures.** Tap-half-of-canvas + buttons cover both directional inputs unambiguously; swipe adds detection complexity (threshold tuning, accidental scrolls) and a second input vocabulary for no gain.
- **No haptic API calls.** Browser haptic support is patchy and inconsistent; native button `:active` states + OS-level haptics on physical buttons are sufficient. Reserved for v0.6+ if user feedback asks.
- **No landscape-specific button layout.** Landscape hides buttons entirely (canvas centered) per Planning-Lead spec. A landscape button layout would require a third visual mode to maintain — not worth it for v0.5.4.
- **No button labels (text under icons).** Icons are universal enough; adding "왼쪽" / "오른쪽" text under each button would crowd the strip and shrink the buttons. Reserved as an optional v0.6+ accessibility toggle.

## v0.5.6 Choice & Countdown

Two new game states sit in front of every fresh game start: **CHOICE** asks the player whether to play the tutorial, and **COUNTDOWN** gives a calm 3-2-1 lead-in before PLAYING begins. PAUSED→PLAYING resume and STAGE_CLEAR→next-stage both bypass the countdown (the player is already engaged; only fresh starts get the count-in). Visual language stays inside the existing cozy palette — no new colors, no new fonts, no new assets.

### Copy decisions (cozy tone)

| Element | Korean copy | Reason |
|---|---|---|
| CHOICE title | `천천히 시작해볼까요?` | "어떻게 시작할까요?" is functional but neutral. "천천히" (slowly / take it easy) primes the player for a cozy, no-pressure choice — and pairs naturally with the tutorial being the gentle option. Ends in a soft question, never an imperative. |
| CHOICE subtitle (optional, small) | `처음이라면 튜토리얼을 추천해요` | One-line nudge so the choice isn't ambiguous. Polite informal register (-요), no exclamation marks. |
| Tutorial button | `튜토리얼부터 시작` | Adds "부터" (starting from) to imply "and then the real game" — sets expectation that tutorial is a step on the way, not a side trip. |
| Skip button | `바로 게임 시작` | "건너뛰기" (skip) frames the tutorial as something to escape; "바로 게임 시작" (start the game right away) frames the skip as an equally valid first action. Cozy tone treats both choices as good choices. |
| Countdown skip hint | `Space · Esc — 바로 시작` | Mirrors the same "바로" verb as the skip button so the player learns "바로 = jump in." Kept short and lowercase-feel even in Korean. |

### 1. CHOICE screen tokens

CHOICE renders as the standard `.overlay` card (same cream background, same `--radius-ui`, same shadow) with two large buttons stacked horizontally below the title. Visually distinct from mobile rotate buttons (those are play-action; these are start-decision), so the buttons use a wider, more "card-like" silhouette — wider than tall, never square, never circular.

| Token | Value | Reason |
|---|---|---|
| `--choice-title-text` | `천천히 시작해볼까요?` | See copy table above. |
| `--choice-title-color` | `var(--text-strong)` (`#3b2a1a`) | Same warm ink as `.overlay-content h2`. Continuity. |
| `--choice-title-size` | `22px` | Matches existing `.overlay-content h2`. Reusing the established overlay title scale prevents "this dialog feels different." |
| `--choice-subtitle-color` | `var(--text-muted)` (`#8a7460`) | Matches existing `.overlay-content p`. |
| `--choice-subtitle-size` | `14px` | Matches existing `.overlay-content p`. |
| `--choice-btn-bg` | `var(--bg-board)` (`#fff4dc`) | Same soft butter as the play surface — the buttons feel "cut from the board." |
| `--choice-btn-bg-highlight` | `#f4d9a8` | Same step as `--mobile-btn-bg-pressed`. Used for keyboard-focus / hover / arrow-key highlight (the active option). Warm, not muddy. |
| `--choice-btn-text-color` | `var(--text-strong)` (`#3b2a1a`) | Continuity with all other primary text. |
| `--choice-btn-border` | `1px solid var(--border-board)` (`#e6c9a3`) | Same hairline as mobile buttons — buttons feel like part of the world, not chrome. |
| `--choice-btn-border-highlight` | `2px solid var(--accent)` (`#f4a261`) | The highlighted option gets the warm-orange accent ring. Reuses an existing brand color rather than introducing a new focus color. Border thickens from 1px→2px **without changing layout** (compensated by 1px less padding on highlight state, or `outline` instead of border-width swap — implementation choice). |
| `--choice-btn-radius` | `14px` | Slightly larger than `--radius-ui` (12px) so the choice buttons read as softer/friendlier than the overlay card containing them. Calm proportion. |
| `--choice-btn-padding-y` | `14px` | Comfortable vertical breathing room — taller than a typical button so the cards feel "pickable," not "clickable." |
| `--choice-btn-padding-x` | `24px` | Generous side padding so the label has room to breathe even with longer Korean strings ("튜토리얼부터 시작" = 9 chars). |
| `--choice-btn-min-width` | `160px` | Both buttons match width regardless of label length — visual symmetry. 160px holds the longer of the two labels at 16px font with comfortable side padding. |
| `--choice-btn-font-size` | `16px` | One step up from the subtitle (14px). Big enough to feel like the primary action, small enough to fit two side-by-side inside the overlay card. |
| `--choice-btn-font-weight` | `500` | Medium weight — bolder than body text (400) but not heavy (700). Cozy buttons don't shout. |
| `--choice-btn-shadow` | `0 2px 0 #e6c9a3, 0 4px 10px rgba(120, 90, 60, 0.10)` | Same two-layer shadow language as `--mobile-btn-shadow` but with slightly lighter long-shadow alpha (0.10 vs 0.12) because these sit inside the overlay card which already has its own shadow — avoids shadow-on-shadow heaviness. |
| `--choice-btn-shadow-pressed` | `0 1px 0 #e6c9a3, 0 2px 6px rgba(120, 90, 60, 0.08)` | Same "press collapses 2px→1px" tactile pattern as mobile buttons. |
| `--choice-btn-gap` | `16px` | Comfortable separation between the two options. Wide enough to feel like two distinct choices (not a single segmented control), narrow enough that both fit in the overlay card without forcing wrap on a 360px-wide mobile viewport. |
| `--choice-btn-icon` | `none` | **Decision: text-only, no icons.** Adding icons (a small graduation cap for tutorial, a play triangle for skip) would tilt the visual weight toward the iconic option and turn the choice into a recommendation. Two equal-weight text buttons read as "two valid paths," matching the cozy philosophy that both choices are good. |
| `--choice-btn-layout` | `flex, row, justify-content: center, gap: var(--choice-btn-gap)` | On overlay widths ≥ 360px both buttons sit side-by-side. On narrower viewports they wrap to a column automatically via `flex-wrap: wrap`. No separate mobile media query needed. |

**Distinct from mobile play-buttons (`--mobile-*`):** the choice buttons are wider-than-tall rectangles with text only; mobile buttons are square-ish with icons only. The eye reads "this is a decision dialog" vs "these are play controls" instantly, even on the same screen. The highlight color (`--accent` orange) is also unique to CHOICE — mobile buttons never use the accent ring.

### 2. COUNTDOWN screen tokens

COUNTDOWN dims the board and overlays a single large number that fades in, holds, and fades out across exactly 1 second per number. The board state under the mask is whatever the next state will render (Tutorial layout or Stage 1 layout) — players see the world they're about to enter, just softened.

| Token | Value | Reason |
|---|---|---|
| `--countdown-number-font` | `-apple-system, BlinkMacSystemFont, "Segoe UI Rounded", "SF Pro Rounded", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif` | System rounded stack first ("Segoe UI Rounded" on Windows, "SF Pro Rounded" on macOS/iOS), Korean-friendly fallbacks next ("Apple SD Gothic Neo", "Malgun Gothic"), generic sans last. No font download — meets the "system fonts only" constraint. The rounded variants when available reinforce 아기자기; the regular system font fallback is acceptable because countdown digits 1/2/3 read fine in any sans. |
| `--countdown-number-size` | `120px` | Midpoint of the 96–140px recommended range. On the 400px canvas, 120px digit height = 30% of canvas height — dominant without overwhelming. Tested mentally: at 96px the number competes with HUD text; at 140px it brushes the canvas edges on mobile portrait viewports. 120px sits comfortably. |
| `--countdown-number-weight` | `700` | Bold so the digit reads instantly against the masked board. Not 900 (too aggressive) — 700 is "confident but soft," matching the rounded font's character. |
| `--countdown-number-color` | `var(--text-strong)` (`#3b2a1a`) | Warm dark ink, same as HUD numerics. **Rejected:** pure white (`#fff`) — would feel like a video-game countdown, breaks cozy palette. **Rejected:** `--accent` orange — too saturated at 120px size. The warm dark on a softly-masked cream board has the right "calm but visible" feel. |
| `--countdown-number-shadow` | `0 2px 8px rgba(255, 244, 220, 0.6)` | Soft cream glow behind the digit — not a hard drop shadow. Helps the number lift cleanly off the masked board without introducing a second ink color. Cream-tinted (not gray) so the glow stays inside the cozy palette. |
| `--countdown-fade-in-ms` | `180ms` | Quick enough to land on the beat ("3!"), slow enough to feel soft. |
| `--countdown-hold-ms` | `640ms` | The number sits at full opacity & target scale for the middle of each second. 180ms in + 640ms hold + 180ms out = 1000ms exactly. |
| `--countdown-fade-out-ms` | `180ms` | Symmetric with fade-in for visual balance. |
| `--countdown-scale-from` | `0.7` | Each number starts at 70% size during fade-in. Small-to-full gives a gentle "pop in" — the world is preparing to receive the player. |
| `--countdown-scale-to` | `1.0` | Reaches full size at the end of fade-in, holds at 1.0 through `--countdown-hold-ms`, and **stays at 1.0 during fade-out** (alpha-only). Shrinking during fade-out reads as "retreating"; alpha-only reads as "dissolving into the next moment." Same principle as the v0.5.3 bulge fade. |
| `--countdown-easing-in` | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quart-ish) | The "pop in" curve — fast at first, settling softly into 1.0 scale. |
| `--countdown-easing-out` | `linear` | Fade-out is alpha-only and linear — no "easing out of the easing." |
| `--countdown-mask-color` | `#3b2a1a` | **Decision: warm dark ink, NOT reuse `--mask-outside`.** `--mask-outside` is a warm tan at 0.18 alpha used to dim _inactive_ play area while keeping the active area readable. Countdown mask needs to dim the _entire_ canvas more decisively so the number reads as the primary element. Using `--text-strong` as the mask base keeps the tint inside the cozy warm-brown family (never gray, never black) while reaching the required darkness at higher alpha. |
| `--countdown-mask-alpha` | `0.35` | Midpoint of the recommended 0.30–0.40 range. At 0.30 the board still competes with the number; at 0.40 the board starts to feel "off"/dead. 0.35 reads as "softly hushed" — the next state's layout is still legible beneath. |
| `--countdown-mask-fade-in-ms` | `220ms` | The mask itself fades in once when COUNTDOWN begins (not per-number). 220ms is slightly slower than the first number's fade-in so the mask lands first, then "3" appears on the calm. |
| `--countdown-mask-fade-out-ms` | `160ms` | When countdown ends (or is skipped), mask fades out smoothly into PLAYING — never a hard cut. Slightly faster than fade-in because the player is now "in" the game; lingering would feel sluggish. |

**Number layout:** absolutely-positioned, centered on the canvas. Text-align center, line-height 1. No background card, no border — just the digit floating on the masked board with its soft cream glow.

### 3. Countdown skip hint tokens

A small, polite hint sits near the bottom of the canvas during COUNTDOWN telling the player they can skip. Disappears the moment they do (or when countdown reaches 0 naturally).

| Token | Value | Reason |
|---|---|---|
| `--countdown-skip-text` | `Space · Esc — 바로 시작` | See copy table above. The middle dot (`·`) separates the two keys cleanly without "or" — visually quieter. |
| `--countdown-skip-font-size` | `12px` | Same as `.hint` / `.version`. Continuity with existing fine-print scale. |
| `--countdown-skip-color` | `var(--text-muted)` (`#8a7460`) | Same as existing hint text. Muted so it never competes with the countdown number. |
| `--countdown-skip-opacity` | `0.85` | Slightly knocked back from full opacity because it sits on top of the 0.35 mask which already darkens its background — full opacity at 12px read "too eager." 0.85 reads "available, not pushy." |
| `--countdown-skip-position` | `absolute, bottom: 24px, horizontally centered on the canvas` | Inside the canvas viewport (not the page), so on mobile portrait it stays clear of the controls strip. 24px from the bottom edge gives the same breathing room as `.container` padding. |
| `--countdown-skip-fade-in-ms` | `400ms` | Slow fade-in starting ~300ms after countdown begins — same "settle in" pattern as `--touch-zone-hint-fade-in`. The player should see "3" first, then the skip hint quietly appears. |
| `--countdown-skip-fade-out-ms` | `120ms` | Quick fade-out on skip or natural end — once the player presses Space/Esc or "1" finishes, the hint clears immediately. |

**Visibility rule:** the skip hint is shown during all three countdown numbers, not just the first. A player who decides mid-countdown to skip should not have to recall a hint that already disappeared.

### Drawing order during COUNTDOWN

1. Page background
2. Canvas with the upcoming state pre-rendered (Tutorial layout or Stage 1 layout — snake at start position, apple placed, grid drawn)
3. **Countdown mask** — full-canvas rect filled with `rgba(59, 42, 26, 0.35)` (the `--countdown-mask-color` at `--countdown-mask-alpha`), fades in once at COUNTDOWN entry
4. **Countdown number** — centered, with its own per-number fade-in/hold/fade-out cycle
5. **Skip hint** — bottom-center inside the canvas, fades in ~300ms after countdown begins
6. HUD (Stage / Score / Best) — unchanged, sits above the canvas, never masked

The pre-rendered world being visible under the mask is intentional: it answers "what am I about to play?" before the player commits, reducing surprise.

### Performance budget (60fps check)

Per countdown frame: 1 full-canvas mask rect (`fillRect`) + 1 large text draw (`fillText` with shadow) + 1 small text draw (skip hint). That's 3 draw calls and 1 text shadow per frame for the ~3 seconds COUNTDOWN is on screen. Trivial — well under frame budget. Mask is a single rect, not a per-cell darken. **No performance risk at 60fps.**

### Payload check

Estimated additions:
- CSS for choice button styles + countdown number styles: ~0.8KB
- HTML for choice overlay (two buttons + title structure): ~0.3KB
- JS for CHOICE state, COUNTDOWN state, timing loop, skip handler, button event wiring: ~1.8KB

Total estimated: ~2.9KB. Current 29.6KB → projected ~32.5KB, comfortably under the 50KB cap (~17.5KB headroom remains).

### What v0.5.6 intentionally does NOT include

- **No countdown sound.** Audio is not yet in the project; introducing it for the countdown alone would set an inconsistent precedent. When sound lands (v0.6+), countdown gets a soft wood-block tick per number — reserved, not now.
- **No "Don't show again" toggle on CHOICE.** Returning players will see CHOICE on every new game; if this becomes annoying, the planned solution is a persistent "Skip tutorial next time" toggle in v0.6+, not removing the CHOICE itself.
- **No icons on choice buttons.** See `--choice-btn-icon: none` rationale above.
- **No animated countdown background** (sparkles, expanding rings, etc.). Cozy is calm; the mask + number is enough.
- **No mid-countdown rotation input handling.** Rotation keys are ignored during COUNTDOWN — the snake hasn't started moving yet, so rotations would be lost or queued ambiguously. Only Space and Esc do anything during COUNTDOWN (both skip).
