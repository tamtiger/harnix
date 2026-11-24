# Risk before ready

Three short passes before `ready` on a Full task, an expensive-to-undo change or a plan whose failure would hurt. Keep the output in the task (criteria, checks, `--add-risk`, `--add-decision`), not in a new file.

## 1. One-way door

Ask what undoing the change costs: money, time, user trust, data, a published contract. If undoing needs a data migration, a public-contract change, a publish or a deletion, it is a one-way door: make the task Full, run passes 2 and 3, and for schema or data also load `harnix skill harnix-migration-safety`. A two-way door (one revert restores everything) stays Lite and normally skips the other passes. Record the verdict with `--add-decision` (id `trace-door`).

## 2. Load-bearing conditions

List what must be true for the plan to work (a dependency behaves as assumed, a file keeps its shape, a limit holds). Mark the load-bearing ones and rate your confidence high, medium or low. A load-bearing condition with medium or low confidence is a killer condition: name the cheapest test that settles it.

- Testable by the task itself: make it a criterion with a check.
- Not testable inside the task: settle it with a spike (one bounded experiment or one `harnix-research` pass) before `ready`.
- Still open after that: record it with `--add-risk` and say who decides.

## 3. Premortem

Write "it is [horizon] later and this change failed" in the past tense and list causes without filtering. Group them and keep the few that are both likely and costly. Record each kept cause in one `--add-risk` text (`--severity` from likelihood and cost, `--mitigation` folded in):

- **Tripwire:** the earliest observable sign that the cause is happening.
- **Mitigation:** what lowers its odds or its damage.
- **Stop condition:** the observation that means stop and replan instead of pressing on.

A cause without a tripwire and a stop condition is a worry, not a risk: sharpen it or drop it. A cause with a sharp tripwire often belongs in a check instead.

## When not to use

- A localized change that one revert undoes, with an obvious contract and one focused check.
- A decision already made and recorded: the premortem exists to change the plan, not to decorate it.
- Anything that needs only a fact: run `harnix-research` instead.
- More than a handful of kept causes: you are listing, not choosing. Keep the worst ones.
