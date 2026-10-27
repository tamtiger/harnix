# Implementation plan

1. Add failing template and research tests for explicit persistence boundaries, stage-aware skill text, bounded repository discovery, and remaining uncertainty.
2. Refine the generated `.harnix/workflow.md` template with a compact operational sequence: restore/create, persist planning, ready gate, implementation checkpointing, ordered verification, and completion.
3. Refine every generated `harnix-*` skill so it declares the state it accepts, the state/checkpoint it persists, and when it returns control.
4. Update the root AGENTS bootstrap to reinforce that project profile values are hints and current repository evidence is authoritative for task context.
5. Extend research rendering with a required remaining-uncertainty field and regression protection.
6. Align PRD, canonical workflow, implementation plan, and changelog with the clarified behavior.
7. Run focused tests, then compliance review, then type/lint/full test/build quality gates; record fresh evidence in `task.json` before finishing.

## Material-unknown decision

No new public or hidden task-management command is needed for this iteration. The existing persisted schemas and runtime helpers are adequate; the material gap is that generated instructions and skills do not operationalize them. Reassess only if regression fixtures show that a consumer agent still cannot maintain valid state from the generated artifacts.
