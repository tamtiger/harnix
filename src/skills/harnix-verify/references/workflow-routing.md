# Workflow routing and public commands

Adds only what the Route section of `.harnix/workflow.md` (routing table, Lite and Full, stop rules) leaves out.

- A `blocked` task resumes only at its recorded status: read the blocker, resolve or report it, then continue there
  unless the user cancels it. A `completed` or `cancelled` task whose pointer remains routes to `verify`.
- `harnix-review` and `harnix-research` are Bypass: they never read or change an active task and do not need this page.
  The Bypass list itself lives only in the always-loaded rules.
- Work kinds (feature, bugfix, hotfix, refactor, test, docs, maintenance, migration, dependency, security, performance,
  release) are not extra workflows: pick Lite or Full from actual risk and keep the same gates. A Full task adds
  `design.md` or research only when they clarify a boundary.

### Public commands

`harnix status` (bounded read-only projection of the active task, progress, context freshness and next action), `--summary` (under 80 tokens) and `--explain` (required-check freshness with reason codes and readiness/completion blockers, running nothing); `harnix tasks` (bounded local index); `harnix resume <task-id> [--force] [--next] [--dry-run]` restores only an explicitly selected unfinished task's pointer (it refuses to replace another active task unless `--force`) (`--next` picks the epic's next unfinished task, `--force` pauses the active one); `harnix pause [--dry-run]` clears only the pointer; `harnix epic [--limit N]` (by descending ID, so newest first; `total` counts the epics that load) / `harnix epic <epic-id>` (members in the optional `order` first, set with the hidden `harnix workflow --epic-order <epic-id> <task-id>...`, then by ID; `nextTask` follows that sequence); `harnix archive [--days N] [--apply] [--restore <id>]` (manual, dry run by default: old finished tasks and epics to the read-only archive); `harnix verify-plan [--recursive] [--path <dir>] [--changed] [--brief]` (test/lint/typecheck/format commands per package and nested repositories); `harnix context-report --platform <p>` (effective hook-context metadata; `<p>` is `kiro`, `antigravity`, `codex`, `claude`, `opencode` or `cursor`, required as for the hook `harnix context --platform <p>`); `harnix repo-map --query|--impact|--tests|--outline|--refs` (navigation hints only; platform hooks must not invoke repository-map queries, impact or refreshes); `harnix skill [name] [--raw] [--reference <topic>]`; `harnix doctor`, `harnix update`. Their output omits private task prose, commands, prompts, hashes, secrets and absolute paths.
