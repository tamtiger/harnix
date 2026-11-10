# Harnix workflow

Lean operational sheet; skills hold the procedures (`harnix skill harnix-<stage> --raw`, plus `--reference <topic>`). Section detail, only when a rule here is not enough: `harnix skill harnix-verify --reference <workflow-routing|task-state|gates|agent-transport|cookbook-notes|cookbook-commands>`.

## Route

Run `harnix workflow --preflight` for project-scoped Lite/Full work or an explicit request to inspect or continue a task, then load only the skill `nextStage` names.

| Persisted state | `nextStage` | Skill |
| --- | --- | --- |
| no active task; `planning`; any checkpoint `replan`; stale context | `plan` | `harnix-plan` |
| `ready` | `await` until the latest request authorizes implementation, then `implement` | `harnix-implement` |
| `in_progress/implementing` | `implement` | `harnix-implement` |
| `in_progress` or `verifying` at `debugging` | `debug` | `harnix-debug` |
| `verifying/verifying`, `verifying/finishing`, a finished task whose pointer remains | `verify` | `harnix-verify` |
| `blocked` | the owner of its `resumeStatus`; read the blocker first | as mapped |
| retry limit reached, or an invalid pointer | `stop`: report the persisted blocker | none |

`harnix-review` and `harnix-research` own no task state (Bypass) and never read an active task. One active task moves `planning → ready → in_progress → verifying → completed`; `cancelled` is a separate terminal state. Debugging, replan, finishing and cancelling are checkpoints, not workflows. A task is blocked only by a concrete decision, authority, credential, external dependency or repository condition.

- **Lite:** localized, low-risk, obvious contract, one focused check; a compact `task.json` only. **Full:** cross-layer, security-sensitive, migration-heavy or uncertain; also non-empty `prd.md` and `plan.md` with a `- [ ]` item.

Plan-only requests stop at `ready`. Full tasks and Epics stop at `ready`/`await` for user review; only a Lite task whose latest request already authorized implementation goes straight to `in_progress`.

## Task state

- **Record:** TaskRecord schema v3 (`harnix workflow --schema` prints the exact fields): goal, criteria, validation plan (checks with sorted `criterionIds` and `inputs`), evidence, decisions, residual risks, `epicId`. v1/v2 are legacy; migrate once (`harnix skill harnix-plan --reference migration`).
- **Files:** `.harnix/tasks/<id>/task.json` changes only through `harnix workflow`; `prd.md`, `plan.md`, `design.md`, `research/` are task-owned Markdown you edit directly; `review.md` is derived and always overwritten; `.harnix/tasks/.active` is the pointer; epics live in `.harnix/epics/<id>/`.
- **Obligations** (criteria text, checks, mapping, inputs) freeze at the first persisted `ready`; later changes are one guarded replan with a reason (Gates).
- **Time:** `clock` in preflight is the only time source. **Learning:** `--finish` captures decisions, risks and findings into project learning (untrusted; promote with `harnix learning`). **Guides:** `.harnix/spec/guides/`, only those you change.

## Gates


- **Ready:** a criterion and a required check at least; every non-waived criterion has a focused required check; a suite check (`src/**` + `test/**`, the `verify-plan` test command) when the repository has tests; no `TBD`, `TODO` or `FIXME` in the plan; a Full task repeats `--transition ready/ready --reviewed` after the ready-review. A CLI, docs or test-structure change also gets a focused required check for the project's fast contract tests, when it has them.
- **Contract immutability:** never change a check with a pass; retire a failed check with `--replace-check`; a criterion with evidence needs `--reason` and its passes turn stale. A check edit at `verifying` resumes `verifying/verifying`, elsewhere it stays at `replan` until `ready/ready`. A check that never passed may change only `--cwd` or its description directly; `--remove-check <id>` drops one without evidence.
- **Red baseline:** a suite already red outside the task's scope needs the user's authorization once (`--set-baseline ... --authorized-by user`), never your own.
- **Execute:** persist `in_progress/implementing` before the first product edit; tick the Full checklist per slice (100% before verifying); bump the version once with the project's own version command (standalone: patch; epic member: pre-release `X.Y.0-dev.N`; last member in epic order: the minor release) and regenerate managed output when its canonical input changes.
- **Verify:** persist `verifying/verifying` before the first check; compliance, then quality and security; a pass is fresh only while its `inputDigest` equals the digest recomputed from the current inputs. `--evidence ... --criterion <ids> --met` records a pass and marks criteria in one call.
- **Review:** a standalone task gets `harnix-review` right after implementation, before finish; an epic once, after its last member.
- **Finish:** only from `verifying/finishing` with every criterion `met` or `waived` and every required check fresh; `--finish` is product-read-only; `--cancel --reason <why>` is the separate terminal path, on explicit user instruction.
- **Convergence:** one automatic remediation round; an identical check, digest, exit code and summary is the strongest stop signal; three failed hypotheses mean replan.
- **Commit discipline:** never commit, branch, push, publish or open a pull request without showing the changes and message and approval; run `git branch --show-current` first and never pipe `git checkout`.

## Agent transport

Hidden `harnix workflow` is the only persistence transport and always prints one JSON document. `--preflight` is read-only (`baselineHint`: ask the user to authorize `--set-baseline`; `versionSkew`: the `harnix` on PATH is older than the project; rebuild only if the user allows). `--save` takes one envelope (`--schema` lists it) and is only for new tasks, task text and research; use the flags below for the rest; `--task <id>` edits another unfinished task without moving the pointer. `--finish --brief` also reports `learning` and, on a sign of a secret, `secretAdvisory`: tell the user, never print or commit it.

## Command cookbook

Run from the repository root; read `harnix workflow --schema` once per session. Accented (Vietnamese) text goes through `--file <path>` or bash / `pwsh` 7.4+, never a Windows PowerShell 5.1 pipe; shell recipes: `cookbook-notes`.

```text
harnix status --summary | --criteria | --checks | --explain   # no positional argument
harnix workflow --preflight                  # clock.now and clock.idPrefix are the only time source
harnix workflow --init --title "<title>" [--mode lite|full] [--goal "<g>"] [--text "<criterion>"]... [--with-check "id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>"] [--command "<cmd>"] [--input "src/**"] [--epic <id>] [--follow-up <id>] [--cwd <dir>] [--no-activate] --brief
harnix workflow --transition ready/ready [--reviewed] [--dry-run] --brief
harnix workflow --run-checks --brief         # verify: every required check not passing, stops at the first failure
harnix workflow --run-check <check-id> --brief -- pnpm test   # snapshot, run, record; argv must equal the declared command
harnix workflow --criterion <ids> --met [--transition verifying/finishing] [--finish] --brief
harnix workflow --reset-breaker <check-id> --reason "<why>" --brief   # user-authorized circuit-breaker reset
harnix workflow --replace-check <old> <new> --reason "<why>" [--command --input --criteria --cwd] --brief
harnix workflow --set-check <id> --description "<t>" --scope focused --command "<cmd>" [--cwd <p>] --criteria <ids> --input "src/**" --reason "<why>" --brief
harnix workflow --add-criterion <id> --text "<t>" --check <check-id> --reason "<why>" --brief
harnix workflow --set-criterion <id> --text "<t>" [--reason "<why>"] --brief
harnix workflow --remove-check <id> [--reason "<why>"] --brief   # a check with no evidence
harnix workflow --save | --batch --file <path> --brief   # UTF-8 payload; --batch is atomic and order-independent
harnix workflow --add-decision <id> --text "<t>" --rationale "<why>" | --add-risk <id> --text "<t>" --severity medium --brief
harnix resume --next | <id> --force | harnix pause [--dry-run]   # next epic task | switch task | clear the pointer
harnix workflow --set-baseline <check-id> --result fail --classification pre-existing --authorized-by user --scope "<why>" --brief   # user-authorized
harnix workflow --cancel --reason "<why>"     # terminal, only on explicit user instruction
harnix workflow --finish --brief
```

`--run-check` runs one executable with an argument array (for `a && b` use `-- bash -c "a && b"`); never pipe `harnix` into a nested `pwsh -Command`. Rarer forms (`--tick`, `--evidence`, `--set-title`, `--set-goal`, `--set-paths`, `--epic-order`, `--remove-risk`, `repo-map`) and every flag: `cookbook-commands`, `harnix workflow --schema --full`.
