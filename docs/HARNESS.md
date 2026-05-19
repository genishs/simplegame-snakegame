# Team harness

The project is run by four parts. Each part has a **Lead** who makes decisions and a **Teammate** who executes. All eight roles are realized as Claude Code sub-agents living in the operator's local `.claude/agents/` directory (not committed); this document is the human-readable description of who does what.

## Why a harness for a solo study project?

Two reasons:

1. **Separation of concerns enforces quality.** When the same agent decides scope, writes code, designs visuals, and merges PRs, shortcuts creep in. Splitting the roles forces each decision to pass through a reviewer.
2. **The structure is the lesson.** Versions advance only when planning → design → development → SCM has fully cycled. Slow on purpose, so each layer leaves a trace.

## Roles

### Planning

| | Responsibility |
|---|---|
| **`planning-lead`** | Owns the version roadmap. Decides what is in scope for each version vs. what defers. Signs off on scope *before* a feature branch is opened. Coordinates with Design Lead on visual milestones. |
| **`planner`** | Turns the Lead's brief into a concrete spec at `docs/specs/v0.X.md`. Writes user stories and acceptance criteria. Does not decide scope. |

### Development

| | Responsibility |
|---|---|
| **`dev-lead`** | Decides *how* features are implemented. Sketches the implementation plan before code is written. Reviews the developer's branch with line-level feedback. Enforces architecture rules (no build step, vanilla JS, payload budget). |
| **`developer`** | Implements on a `feature/v0.X-<slug>` branch. Updates `VERSION`, the in-page version string, and `HISTORY.md` as part of the work. Opens a PR; never merges to `main`. |

### Design

| | Responsibility |
|---|---|
| **`design-lead`** | Owns the **아기자기 (cute, cozy)** visual direction. Maintains `docs/design/STYLE.md` as the design-token source of truth. Approves what visual upgrade lands per version vs. defers toward v1.0. |
| **`designer`** | Implements the Lead's brief in CSS, inline SVG, and canvas primitives. Honors `STYLE.md` exactly; does not invent palette values. Keeps assets inline so deployment stays static. |

### SCM

| | Responsibility |
|---|---|
| **`scm-lead`** | Final merge authority on `main`. Tags releases. Maintains `docs/WORKFLOW.md`. Writes the release-note paragraph appended to `HISTORY.md`. |
| **`scm`** | Reviews every PR. Runs the play-test checklist. Posts findings as a PR comment. Blocks merge until checks pass; never merges. |

## Collaboration flow per version

```
planning-lead   →  defines GOAL, IN-SCOPE, NON-GOALS for v0.X
       ↓
planner         →  writes docs/specs/v0.X.md
       ↓
design-lead     →  briefs visual deliverables (if visual work in scope)
       ↓
designer        →  drafts assets / CSS / canvas primitives
       ↓
dev-lead        →  sketches implementation plan
       ↓
developer       →  implements on feature/v0.X-<slug>, opens PR
       ↓
scm             →  PR review + play-test checklist
       ↓
scm-lead        →  merge to main, tag v0.X, update HISTORY release note
       ↓
Pages deploy    →  Actions publishes to https://genishs.github.io/simplegame-snakegame/
```

If a step has nothing to do (e.g. a version with no visual work), the corresponding agent is skipped, but the flow order is preserved.

## Standing rules (everyone honors)

- **Stages 1–3 must feel very easy.** Real difficulty only ramps from stage 4. This is a user-set design rule; do not override.
- The visible version in `index.html`, the `VERSION` file, and the `HISTORY.md` heading must always agree.
- No direct pushes to `main` from anyone. Always via PR.
- No build tooling. No frameworks. Vanilla JS until explicitly approved otherwise.
- Total page payload stays under ~50 KB through v1.0 unless the Dev Lead justifies an exception.
