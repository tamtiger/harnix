# Harnix workflow

Lean operational sheet. The always-loaded rules come first; skills hold the procedures (`harnix skill harnix-<stage>`, plus `--reference <topic>`). Detail of each section loads on demand with `harnix skill harnix-verify --reference <workflow-routing|task-state|gates|agent-transport|cookbook-notes|cookbook-commands>` (only when a rule here is not enough).

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

- **Lite:** localized, low-risk, obvious contract, one focused check; a compact `task.json` only.
- **Full:** cross-layer, security-sensitive, migration-heavy or uncertain; also non-empty `prd.md` and `plan.md` with a `- [ ]` item.

Plan-only requests stop at `ready`. Full tasks and Epics stop at `ready`/`await` for user review; only a Lite task whose latest request already authorized implementation goes straight to `in_progress`.

## Task state

- **Record:** TaskRecord schema v3 (`harnix workflow --schema` prints the exact fields): goal, criteria, validation plan (checks with sorted `criterionIds` and `inputs`), evidence, decisions, residual risks, `epicId`. v1/v2 are legacy; migrate once (`harnix skill harnix-plan --reference migration`).
- **Files:** `.harnix/tasks/<id>/task.json` changes only through `harnix workflow`; `prd.md`, `plan.md`, `design.md`, `research/` are task-owned Markdown you edit directly; `review.md` is derived and always overwritten (point the user there for a plain-file review); `.harnix/tasks/.active` is the pointer; epics live in `.harnix/epics/<id>/`. Tasks, research and journals are user-owned.
- **Obligations** (criteria text, checks, mapping, inputs) freeze at the first persisted `ready`; later changes are one guarded replan with a reason, and criteria mapped by evidence and checks with a pass stay immutable.
- **Time:** `clock` in preflight is the only time source. **Learning:** `--finish` captures decisions, residual risks and findings into project learning (untrusted data; promotion is manual with `harnix learning`). **Guides:** read only the `.harnix/spec/guides/` files matching what you change.

## Gates

- **Ready:** at least one criterion and one required check; every non-waived criterion has a focused required check; a project-level suite check (`src/**` + `test/**` with the `verify-plan` test command) when the repository has tests; no placeholder tokens (`TBD`, `TODO`, `FIXME`) in the plan; a Full task repeats `--transition ready/ready --reviewed` after the ready-review (`--dry-run` prints `reviewChecklist`). A task that changes the CLI, docs or test structure adds the focused check `pnpm run test:gates`.
- **Contract immutability:** never change a criterion mapped by recorded evidence or a check with a pass; retire a failed check with `--replace-check`. A check edit at `verifying` resumes at `verifying/verifying`; elsewhere it stays at `replan` until `ready/ready`.
- **Red baseline:** a suite already red outside the task's scope needs the user's authorization once (`--set-baseline ... --authorized-by user`), never your own.
- **Execute:** persist `in_progress/implementing` before the first product edit; tick the Full checklist per slice (100% before verifying); bump the version with `pnpm version:sync` (standalone: patch; epic member: `X.Y.0-dev.N`; last member: minor with `--fold-dev`) and run `pnpm selfhost:sync` after editing this template.
- **Verify:** persist `verifying/verifying` before the first check; compliance, then quality and security. A pass is fresh only while its `inputDigest` equals the digest recomputed from the current inputs (CRLF read as LF in text files; the former formula stays recognised).
- **Finish:** only from `verifying/finishing` with every criterion `met` or `waived` and every required check fresh; `--finish` is product-read-only. `--cancel --reason <why>` is the separate terminal path on explicit user instruction.
- **Convergence:** one automatic remediation round; an identical check, digest, exit code and summary is the strongest stop signal; three failed hypotheses mean replan.
- **Commit discipline:** never commit, branch, push, publish or open a pull request without showing the changes and message and getting approval.

## Agent transport

Hidden `harnix workflow` is the only persistence transport and always prints one JSON document. `--preflight` is read-only (`baselineHint`: ask the user to authorize `--set-baseline`; `versionSkew`: the `harnix` on PATH is older than the project, newer gates may be missing, rebuild only if the user allows). `--save` takes one bounded envelope `{ task, artifacts?, contractRevision?, epic?, epicMembers? }` and is only for new tasks, task text and research; use the flags below for everything else. `--task <id>` edits another unfinished task without changing the pointer. `--finish --brief` also reports `learning` and, on a sign of a secret, `secretAdvisory`: tell the user, never print or commit it.

## Command cookbook

Run from the repository root. Read `harnix workflow --schema` once per session. Never patch `task.json`, `review.md` or `.active` by hand. Accented (Vietnamese) text never goes through a Windows PowerShell 5.1 pipe or `-File` script: use `--file <path>` (for example `.harnix/tmp/payload.json`) or bash / `pwsh` 7.4+ (`<` redirection does not work in PowerShell; JSON on stdin stays under 64 KiB). Double-quote text in PowerShell and single-quote it in bash when it contains backticks or `$`.

```text
harnix status --summary | --criteria | --explain   # micro status | criteria projection | freshness reasons
harnix workflow --preflight                  # clock.now and clock.idPrefix are the only time source
harnix workflow --init --title "<title>" [--mode lite|full] [--goal "<g>"] [--text "<criterion>"]... [--with-check "id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>"] [--command "<cmd>"] [--input "src/**"] [--epic <id>] [--follow-up <id>] [--cwd <dir>] --brief
harnix workflow --transition ready/ready [--reviewed] [--dry-run] --brief
harnix workflow --run-checks --brief         # verify, main path: every required check that is not passing, stops at the first failure
harnix workflow --run-check <check-id> --brief -- pnpm test   # snapshot, run, record; argv must equal the declared command
harnix workflow --evidence --check <id> --result pass --exit-code 0 --summary "<command> - <result>" --brief
harnix workflow --criterion <ids> --met [--transition verifying/finishing] --brief
harnix workflow --tick <item|all>            # tick plan.md checklist items
harnix workflow --reset-breaker <check-id> --reason "<why>" --brief   # user-authorized circuit-breaker reset
harnix workflow --replace-check <old> <new> --reason "<why>" [--command --input --criteria --cwd] --brief
harnix workflow --set-baseline <check-id> --result fail --classification pre-existing --authorized-by user --scope "<why>" --brief
harnix workflow --transition verifying/finishing [--finish] --brief
harnix workflow --set-check <id> --description "<t>" --scope focused --command "<cmd>" [--cwd <p>] --criteria <ids> --input "src/**" --reason "<why>" --brief
harnix workflow --add-criterion <id> --text "<t>" --check <check-id> --reason "<why>" --brief
harnix workflow --set-criterion <id> --text "<t>" [--reason "<why>"] --brief   # mapped criteria stay immutable; a Lite task implementing without evidence resumes by itself
harnix workflow --remove-risk <id> --brief   # drop a settled residual risk
harnix workflow --set-title | --set-goal "<t>" | --set-paths --relevant-path <p> --brief
harnix workflow --save | --batch --file <path> --brief   # UTF-8 payload; --batch is atomic and order-independent
harnix workflow --add-decision <id> --text "<lesson>" --rationale "<why>" --brief
harnix workflow --add-risk <id> --text "<risk>" --severity medium [--mitigation "<t>"] --brief
harnix resume --next | <id> --force          # next epic task | switch task
harnix skill <name> [--raw] [--reference <topic>]
harnix workflow --finish --brief
```

`--run-check` runs one executable with an argument array (for `a && b` use `-- bash -c "a && b"`); `--evidence` needs `--exit-code`. List flags accept `a,b` or a repeated flag. Never pipe `harnix` into a nested `pwsh -Command`. In PowerShell read JSON with `$out = harnix workflow --inspect | Out-String; $j = $out | ConvertFrom-Json`. Multi-repo: `harnix skill harnix-plan --reference multi-repo`. Every other flag, the envelope shape and shell recipes: the `cookbook-notes` and `cookbook-commands` references.
