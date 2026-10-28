# Plan critique

An optional pass on a Full task (or an epic member that needs it) after the plan is written and before the ready self-review. One round at most; when you skip it, record it as `skipped`.

## Lenses

- **Coverage:** every requirement maps to a criterion, a slice and a required check; no slice lacks a requirement.
- **Evidence:** each claim about existing code, commands or paths rests on something you read in this session.
- **Executability:** every slice names its files, interfaces and a RED then GREEN command that exists; the order hides no dependency.
- **Risk:** failure, rollback, security and compatibility of what changes.
- **Reconciliation (replan only):** the new plan still honors the frozen obligations and the evidence already recorded.

Severity: Critical (cannot be built or breaks a contract), High (likely wrong result), Medium (gap with a workaround), Low (polish).

## Running it

A critic may be a subagent but need not be; without one, reread the plan once per lens. The critic returns candidates only: lens, severity and a quoted excerpt of the plan. You check that the excerpt exists and the claim holds, then record the finding (fix the artifact or `--add-risk`). Report `Consistent` only for what was checked and `Not assessed` for what was not; never merge the two.

## Convergence

- Prefer the fix that simplifies the plan over one that adds to it.
- If most new findings sit in text added by the previous fix round, stop: fix only Critical and High and record the rest as residual risk.
- If a fix is reverted or findings oscillate, stop and report what would end it (a decision, evidence or a scope cut).
- In an epic, rerun the critique for a later member only when an earlier member changed files, a contract or a check it relies on.
