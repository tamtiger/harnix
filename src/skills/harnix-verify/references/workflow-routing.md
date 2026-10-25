# Workflow routing and public commands

Detail behind the Route section of `.harnix/workflow.md`.

Run `harnix workflow --preflight` for project-scoped Lite/Full work or an explicit request to inspect or continue a task. It returns bounded routing metadata; load only the skill `nextStage` names.

| Persisted state | `nextStage` | Skill |
| --- | --- | --- |
| no active task; `planning`; any checkpoint `replan`; stale context | `plan` | `harnix-plan` |
| `ready` | `await` until the latest request authorizes implementation, then `implement` | `harnix-implement` |
| `in_progress/implementing` | `implement` | `harnix-implement` |
| `in_progress` or `verifying` at `debugging` | `debug` | `harnix-debug` |
| `verifying/verifying`, `verifying/finishing`, a `completed` or `cancelled` task whose pointer remains | `verify` | `harnix-verify` |
| `blocked` | the owner of its `resumeStatus`; read the blocker first, resolve or report it, then continue at that status | as mapped |
| retry limit reached, or an invalid pointer | `stop`: report the persisted blocker | none |

`harnix-review` (read-only code review) and `harnix-research` (read-only research) own no task state: they are Bypass, never read or change an active task and do not need this page. The Bypass list
itself lives only in the always-loaded rules.

Use one active task and the success sequence `planning → ready → in_progress → verifying → completed`. `cancelled` is a separate terminal state for explicitly abandoned work. A task is blocked only by
a concrete decision, authority, credential, external dependency or repository condition and resumes only to its recorded status unless the user cancels it. Debugging, replan, finishing and cancelling
are checkpoints, not extra workflows. Work kinds (feature, bugfix, hotfix, refactor, test, docs, maintenance, migration, dependency, security, performance, release) are not extra workflows: pick Lite
or Full from actual risk and keep the same gates.

- **Lite:** localized, low-risk, obvious contract, one focused check; a compact `task.json` only.
- **Full:** cross-layer, security-sensitive, migration-heavy, externally researched or materially uncertain; also non-empty `prd.md` and `plan.md`, and `design.md` or research only when they clarify a
  boundary.

Plan-only requests stop at `ready`. Full tasks and Epics also stop at `ready` (`nextStage: await`) for user review before any code is written; only a Lite task whose latest request already authorized
implementation transitions directly to `in_progress` without another approval prompt.


### Public commands

`harnix status` (bounded read-only projection of the active task, progress, context freshness and next action), `harnix status --summary` (micro status projection under 80 tokens: stage, criteria, check counts and next action) and `harnix status --explain` (required-check digest freshness with reason codes and exact readiness/completion blocker codes, without running anything); `harnix tasks` (bounded local index); `harnix resume <task-id> [--force] [--next] [--dry-run]` restores only an explicitly selected unfinished task's pointer and refuses collisions (`harnix resume --next` selects the epic's next unfinished task, and `--force` pauses any current active task); `harnix pause [--dry-run]` clears only the pointer; `harnix epic [--limit N]` / `harnix epic <epic-id>` (members in the epic's optional `order` first, set with the hidden `harnix workflow --epic-order <epic-id> <task-id>...`, then by ID; `nextTask` follows that sequence); `harnix verify-plan [--recursive] [--path <dir>] [--changed] [--brief]` (deterministic test/lint/typecheck/format commands per package and nested repositories); `harnix context-report --platform <p>` (effective hook-context metadata; `<p>` is `kiro`, `antigravity`, `codex`, `claude`, `opencode` or `cursor`, and the flag is required, as it is for the hook command `harnix context --platform <p>`); `harnix repo-map --query|--impact|--tests|--outline|--refs` (bounded navigation hints only; platform hooks must not invoke repository-map queries, impact or refreshes); `harnix skill [name] [--raw] [--reference <topic>]`; `harnix doctor`, `harnix update`. Private task prose, commands, prompts, hashes, secrets and absolute paths are omitted from their output.
