# Workflow

This document describes how a single version moves from idea to a published `v0.X` tag on GitHub Pages.

## Branch model

- `main` — protected. Always deployable. Only the **SCM Lead** merges here.
- `feature/v0.X-<short-slug>` — every change. One branch per version slice. Examples: `feature/v0.3-cute-snake`, `feature/v0.4-stages`.

There are no long-running branches besides `main`. Hotfix branches, if ever needed, follow the same `feature/...` shape but the version is the patch number (e.g. `feature/v0.3.1-bug`).

## Per-version cycle

### 1. Plan
`planning-lead` posts the structured block:
```
VERSION: v0.X
GOAL: ...
IN-SCOPE: ...
NON-GOALS: ...
DEPENDENCIES: ...
```
`planner` writes `docs/specs/v0.X.md` from that brief.

### 2. Design (if applicable)
`design-lead` briefs the deliverables; `designer` implements per `docs/design/STYLE.md`. Both update `STYLE.md` if a new token is introduced.

### 3. Build
- `developer` creates the branch: `git checkout -b feature/v0.X-<slug>`
- First commit on the branch bumps `VERSION` and the in-page `v0.X` string
- Subsequent commits are focused: one logical change each
- `dev-lead` reviews before the PR opens

### 4. Pull request
`developer` opens the PR via `gh pr create`, targeting `main`. PR body must include:

- a link to `docs/specs/v0.X.md`
- the spec's acceptance criteria as a markdown checklist
- a short rationale paragraph
- a play-test note ("opened in browser, verified ...")

### 5. SCM review
`scm` checks out the PR locally, runs the [test checklist](#test-checklist), and posts the templated comment. Status is **PASS** or **BLOCKED**.

If BLOCKED, `developer` pushes follow-up commits; `scm` re-reviews.

### 6. Approval and merge
`scm-lead` reviews `scm`'s findings and the spec coverage, then merges:
```sh
gh pr merge <num> --squash --delete-branch
```

Squash keeps `main`'s history linear and readable.

### 7. Tag and release notes
On `main`:
```sh
git pull
git tag v0.X
git push origin v0.X
```
`scm-lead` appends the release-note paragraph to `HISTORY.md` (a follow-up PR if needed, or part of the merged PR — preferred).

### 8. Deploy verification
`scm-lead` confirms `gh run list --limit 1` shows the deploy as `success` and the new version string is visible at https://genishs.github.io/simplegame-snakegame/.

## Test checklist

`scm` runs this on every PR before reporting status:

- [ ] Game starts on Space
- [ ] Arrow keys and WASD both move the snake
- [ ] Score increments by 10 on food
- [ ] Game over fires on wall hit
- [ ] Game over fires on self-collision
- [ ] Space restarts after game over
- [ ] Pause on Space mid-game; Space resumes
- [ ] Best score persists across reloads
- [ ] Visible `v0.X` matches the `VERSION` file
- [ ] Spec acceptance criteria all met
- [ ] `HISTORY.md` has a new entry for the version

## Branch protection (enforced on GitHub)

`main` is protected with these rules:

- Pull request required to merge
- 1 approving review required
- Stale reviews dismissed on new commits
- `enforce_admins`: false (so admin can rescue if the rules ever lock everyone out)
- No required status checks initially (Pages deploy runs on `main` after merge, not on PR head)

## Deploy

`.github/workflows/deploy.yml` triggers on push to `main`. It:

1. Checks out the repo
2. Configures the Pages environment
3. Uploads the whole repo root as a Pages artifact
4. Deploys via `actions/deploy-pages@v4`

Average run time: ~25 seconds. Site updates within a minute of merge.

## Anti-patterns the harness refuses

- Direct commits to `main`
- Force-push to `main`
- Skipping `HISTORY.md` updates
- Merging while the version string disagrees across `VERSION` / `index.html` / heading
- "Just this once" framework or build-tool introductions without an architectural review from Dev Lead
