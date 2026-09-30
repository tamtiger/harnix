# Ready self-review

Run every item before `ready`; if one fails keep the current planning status, use checkpoint `replan` for a previously prepared task, and report the exact gap.

- **Decisions:** no unresolved material decision is disguised as an implementation step.
- **Criteria:** every criterion describes behavior or evidence that can be checked.
- **Coverage:** every requirement maps to an implementation slice and a validation check.
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
