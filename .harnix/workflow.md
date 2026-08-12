# Harnix workflow

This workflow applies only after locating the nearest initialized project ancestor or workspace root containing `.harnix/config.yaml`. If no such root exists or its state is invalid, do not create files or automatically run `harnix init`; report the missing or invalid state. Platform setup is a separate, explicit user-global operation and does not create platform integration surfaces in this project.

## Route the request

- **Bypass:** read-only explanation or a trivial action that does not need persisted task state.
- **Lite:** localized, low-risk implementation with clear scope; persist a compact task record.
- **Full:** cross-layer, security-sensitive, migration-heavy, or materially uncertain work; persist PRD/plan and targeted research when needed.

Use one active task and the canonical sequence: planning → ready → in_progress → verifying → completed. A task may be blocked only by a concrete decision, authority, credential, external dependency, or repository condition, and resumes only to its recorded status. Debugging, replan, and finishing are checkpoints, not alternate workflows.

## Persist and restore state

1. Read `.harnix/tasks/.active` before creating work. If it names an unfinished valid task, resume from its persisted status and checkpoint instead of creating a duplicate.
2. For a change request with no active task, create one safe task ID and persist `task.json` with status `planning`; Full also requires `prd.md` and `plan.md`. Point `.harnix/tasks/.active` to that task. Before product edits, persist this planning state and its acceptance/validation scope.
3. Use the exact TaskRecord v1 fields and enums already documented by Harnix: identity, mode, status/checkpoint, goal/non-goals, acceptance criteria, relevant paths/specs, validation plan, evidence, timestamps, and only conditional blocker/completion fields. Do not invent a parallel state file or schema.
4. Treat language and package values in `.harnix/config.yaml` as discovery seeds, not complete repository truth. Verify current manifests, source, tests, and project instructions; select only task-relevant paths and never dump the repository into context.
5. Persist every gate before acting in the next stage: `ready` after the ready gate, `in_progress/implementing` before the first product edit, and `verifying/verifying` before verification. Record fresh evidence after each meaningful check.

Plan-only requests stop at `ready`. When the user requested implementation, a passed ready gate authorizes the transition to `in_progress` without another approval prompt.

## Ready gate

Before implementation, record the goal, non-goals, acceptance criteria, relevant paths/specs, and a validation plan. Resolve material product decisions first. A clear user request to implement authorizes work within that scope; ask again only for a new decision, authority, destructive/external action, or material scope expansion.

## Implement and verify

For behavior changes, prefer RED → GREEN → REFACTOR: reproduce with a focused failing test, make the smallest coherent change, then refactor while green. Preserve unrelated/user-owned content and load only task-relevant context.

Verification has two ordered stages: (1) compliance with the request, PRD/spec, and acceptance criteria; (2) correctness, tests, security, maintainability, and unnecessary complexity. Use fresh focused evidence before the required broader gate. Record actual failures and omitted checks; never infer success from stale or partial output.

Finish only when every criterion is met or explicitly waived with a reason, required evidence is fresh, and persisted state is updated safely. Do not commit, branch, push, merge, publish, or create a PR automatically.
