# Migrate a legacy task to schema v3

Use when the active unfinished task is TaskRecord v1 or v2. Legacy records are read-only except for this one migration; completed and cancelled tasks are never migrated or rewritten.

1. Run `harnix workflow --migrate --brief`. It keeps status and checkpoint, the acceptance criteria, every required check's ID, description, command, scope and required flag, and all prior evidence; it drops the retired `@task-contract` input and appends the exact evidence `task-schema-to-v3` timed from `clock`.
2. `criterionIds` (v1) and `inputs` that cannot be derived are never guessed. If the command reports missing checks, pipe `{ "checks": { "<check-id>": { "criterionIds": [...], "inputs": [...] } } }` on stdin (bash or pwsh 7.4+; never accented text through Windows PowerShell 5.1) and run it again.
3. A blocked task, a v3 task, a completed task or a cancelled task is refused.
4. Earlier passes become stale (`legacy-schema`) and must be rerun. Later obligation changes go through the replan path.
5. Any other save, transition, evidence or finish on an unmigrated legacy task is refused with a migration hint.
