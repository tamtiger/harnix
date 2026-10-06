# Ready self-review

Run every item before `ready`; if one fails keep the current planning status, use checkpoint `replan` for a previously prepared task, and report the exact gap.

- **Decisions:** no unresolved material decision is disguised as an implementation step.
- **Criteria:** every criterion describes behavior or evidence that can be checked.
- **Coverage:** every requirement maps to an implementation slice and a validation check; the project-level suite check runs the project's test command from `harnix verify-plan` (a command that runs only part of the tests is rejected).
- **Contracts:** field names, enums, inputs, outputs, errors, precedence, migration and ownership are exact where they affect implementation.
- **Placeholders:** no `TBD`, `TODO`, "handle appropriately", "similar to above", unnamed type or deferred choice that could change the implementation.
- **Consistency:** PRD, plan, research, task record and repository instructions do not contradict each other.
- **Context freshness:** if continuation reported `contextDrift: stale`, complete context reselection first.
- **Scope:** small enough to implement and verify without mixing independent products.
- **Worktree:** unrelated and user-owned changes are identified and their preservation is explicit.
- **Tracking:** the task name is a readable hyphenated slug; the Full checklist maps one-to-one to the ordered slices and starts unchecked.
- **Artifacts:** a Full task has non-empty `prd.md` and `plan.md`, and the plan has at least one `- [ ]` item (the only checks the ready gate makes on them).
- **Commit discipline:** before any commit, show the changes and message and wait for approval.

A plan may begin with a contract-freeze slice only when it resolves implementation detail, not an undecided product contract.

## What the CLI checks for you

When a task enters `ready/ready`, `harnix workflow --transition` and `--save` reject: hard placeholder tokens (`TBD`, `TODO`, `FIXME`, `???`, `<placeholder>`) in a Full `prd.md` or `plan.md` outside code spans and fences (the issue names `file:line`); a criterion id that `plan.md` never names; a criterion with no required `focused` check (the full-scope suite check does not count; a Lite task only gets an advisory). Soft deferral phrases are advisories. A Full task must also pass `--reviewed` after you run this review; without it the command prints this checklist and what it found, and `--dry-run` returns it as `reviewChecklist`. The rest of this review stays yours: the CLI cannot judge decisions, contracts or scope.
