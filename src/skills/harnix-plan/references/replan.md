# Replan an unfinished task

Use when checkpoint is `replan`, or obligations must change after `ready`.

1. Obligations (criteria text, checks, their criterion mapping and inputs) freeze at the first persisted `ready`. A revision may only supersede pending, unproven obligations.
2. Make the revision with the flag transports: `harnix workflow --set-check ... --reason <10-1000 characters>` or `--add-criterion ... --check <id> --reason <text>`. Each one is a single guarded save that sets checkpoint `replan` (status unchanged) with a `contractRevision`; Harnix appends the skipped audit evidence `task-contract-revision-NN`. Batch every contract edit into one replan so the reruns happen once.
3. Editing a criterion's text needs one `--save` envelope: the inspected task with the new text, checkpoint `replan` and `contractRevision.reason`. Never edit `task.json` directly.
4. Never change a criterion mapped by recorded check evidence, or a check that has a passing evidence item. A check with only `fail` or `skipped` evidence is retired by keeping its ID and definition unchanged and setting only `required: false`, then adding a new required replacement ID with equivalent criterion coverage.
5. Exact replay of the same revision is idempotent.
6. Re-enter the gate: repeat the ready self-review, then `harnix workflow --transition ready/ready`. There is no direct backward transition.
7. After a revision every earlier pass is stale (the task contract is folded into every digest). Rerun each required check once with `harnix workflow --run-check <id> -- <exe> [args...]`.
8. When `contextDrift` is `stale`, treat it as a mandatory replan before context reselection; stop if the same drift remains after one reselection in the same request.
