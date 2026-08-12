export const workflowTemplate = `# Harnix workflow

This workflow applies only after locating the nearest initialized project ancestor or workspace root containing \`.harnix/config.yaml\`. If no such root exists or its state is invalid, do not create files or automatically run \`harnix init\`; report the missing or invalid state. Platform setup is a separate, explicit user-global operation and does not create platform integration surfaces in this project.

## Route the request

- **Bypass:** read-only explanation or a trivial action that does not need persisted task state.
- **Lite:** localized, low-risk implementation with clear scope; persist a compact task record.
- **Full:** cross-layer, security-sensitive, migration-heavy, or materially uncertain work; persist PRD/plan and targeted research when needed.

Use one active task and the canonical sequence: planning → ready → in_progress → verifying → completed. A task may be blocked only by a concrete decision, authority, credential, external dependency, or repository condition, and resumes only to its recorded status. Debugging, replan, and finishing are checkpoints, not alternate workflows.

## Persist and restore state

1. Read \`.harnix/tasks/.active\` before creating work. If it names an unfinished valid task, resume from its persisted status and checkpoint instead of creating a duplicate.
2. For a change request with no active task, create one safe task ID and persist \`task.json\` with status \`planning\`; Full also requires \`prd.md\` and \`plan.md\`. Point \`.harnix/tasks/.active\` to that task. Before product edits, persist this planning state and its acceptance/validation scope.
3. Use the exact TaskRecord v1 fields and enums already documented by Harnix: identity, mode, status/checkpoint, goal/non-goals, acceptance criteria, relevant paths/specs, validation plan, evidence, timestamps, and only conditional blocker/completion fields. Do not invent a parallel state file or schema.
4. Treat language and package values in \`.harnix/config.yaml\` as discovery seeds, not complete repository truth. Verify current manifests, source, tests, and project instructions; select only task-relevant paths and never dump the repository into context.
5. Persist every gate before acting in the next stage: \`ready\` after the ready gate, \`in_progress/implementing\` before the first product edit, and \`verifying/verifying\` before verification. Record fresh evidence after each meaningful check.

Plan-only requests stop at \`ready\`. When the user requested implementation, a passed ready gate authorizes the transition to \`in_progress\` without another approval prompt.

## Ready gate

Before implementation, record the goal, non-goals, observable acceptance criteria, relevant paths/specs, exact affected contracts, and a validation plan. Resolve material product, compatibility, risk, scope, and authority decisions first.

Run a ready self-review: inventory unresolved decisions, map every requirement to an implementation/verification slice, scan for placeholders and ambiguous fields/interfaces, check PRD/plan/research consistency, confirm preservation of dirty user-owned work, and verify the scope is independently implementable. Do not mark a task ready merely because the plan starts with a contract-freeze step; an undecided product contract belongs in planning/replan.

A clear user request to implement authorizes work within the passed scope; ask again only for a new decision, authority, destructive/external action, or material scope expansion.

## Implement and verify

Before product edits, review the plan critically against current source and tests; a material gap routes to replan. For behavior changes, use RED → GREEN → REFACTOR, explicitly verifying that RED fails for the expected reason, keeping GREEN minimal, and refactoring only while green. Preserve unrelated/user-owned content and load only task-relevant context. Verify technical feedback against the current contract instead of applying it blindly.

Verification has two ordered stages: (1) compliance with the request, PRD/spec, and acceptance criteria; (2) correctness, tests, security, maintainability, and unnecessary complexity. Map every claim to a fresh command/inspection, read its relevant full output and exit/result, then record it without erasing earlier failures. Use focused evidence before the required broader gate; never infer success from stale or partial output.

Finish only when every criterion is met or explicitly waived with a reason, required evidence is fresh, and persisted state is updated safely. Do not commit, branch, push, merge, publish, or create a PR automatically.
`;

export { renderSkill, workflowSkills, type SkillTemplate } from "../../skills/catalog.js";
