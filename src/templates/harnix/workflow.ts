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

Before implementation, record the goal, non-goals, acceptance criteria, relevant paths/specs, and a validation plan. Resolve material product decisions first. A clear user request to implement authorizes work within that scope; ask again only for a new decision, authority, destructive/external action, or material scope expansion.

## Implement and verify

For behavior changes, prefer RED → GREEN → REFACTOR: reproduce with a focused failing test, make the smallest coherent change, then refactor while green. Preserve unrelated/user-owned content and load only task-relevant context.

Verification has two ordered stages: (1) compliance with the request, PRD/spec, and acceptance criteria; (2) correctness, tests, security, maintainability, and unnecessary complexity. Use fresh focused evidence before the required broader gate. Record actual failures and omitted checks; never infer success from stale or partial output.

Finish only when every criterion is met or explicitly waived with a reason, required evidence is fresh, and persisted state is updated safely. Do not commit, branch, push, merge, publish, or create a PR automatically.
`;

export interface SkillTemplate { name: string; description: string; body: string; }
export const workflowSkills: SkillTemplate[] = [
  { name: "harnix-brainstorm", description: "Route a request and establish a ready Harnix task.", body: "Incoming state: no active task, or a task in planning. First restore `.harnix/tasks/.active`; classify Bypass, Lite, or Full only when no unfinished task exists.\n\nPersist: for change work, write planning task state before product edits, including goal, non-goals, acceptance criteria, relevant scope, validation, and the active pointer. Full also writes PRD/plan plus a material-unknown decision and any sourced research. Move to ready only after its gate passes.\n\nExit: Bypass returns without task files; plan-only returns at ready; authorized implementation hands a ready task to harnix-implement; unresolved owner decisions persist blocked state." },
  { name: "harnix-implement", description: "Implement a ready Harnix task with focused evidence.", body: "Incoming state: a valid ready task, or an in_progress task resumed at an implementation/debug checkpoint. Load the smallest current repository context; config profile fields are discovery hints, not complete truth.\n\nPersist: write in_progress/implementing before the first product edit. For behavior changes use RED–GREEN–REFACTOR; record focused evidence and a reason plus alternate verification for documented exceptions.\n\nExit: keep in_progress at a resumable checkpoint, route failures to harnix-debug, or persist verifying only after implementation scope and focused checks are complete." },
  { name: "harnix-check", description: "Verify a Harnix task with fresh evidence.", body: "Incoming state: completed implementation in_progress, or a task already resumed in verifying.\n\nPersist: write verifying before checks, then record each fresh command/check, time, exit/result, scope, and concise outcome. Run compliance against request/PRD/spec/acceptance before quality and security.\n\nExit: remain verifying only with clear failed evidence and next action, route a defect to harnix-debug, or hand a fully green task to harnix-finish-work. Partial or stale output cannot complete a task." },
  { name: "harnix-finish-work", description: "Finish a verified Harnix task.", body: "Incoming state: verifying with every required criterion met or explicitly waived and fresh required evidence recorded.\n\nPersist: reread current diff/state, write completed before journaling and clearing the matching active pointer; retain recoverable state if a later persistence step fails.\n\nExit: report actual evidence, omitted checks, and residual risks from completed state. Never commit, push, merge, or create a PR." },
  { name: "harnix-continue", description: "Resume the persisted Harnix task safely.", body: "Incoming state: `.harnix/tasks/.active` may identify an unfinished or partially finished task.\n\nPersist: do not rewrite speculative state; load task record, current-stage artifacts, checkpoint/evidence, and minimum relevant context. Fail closed for corrupt, unsafe, or future state.\n\nExit: route planning/ready/in_progress/verifying to its owning skill; repair-only guidance is returned for invalid state, and no active task returns to triage." },
  { name: "harnix-research", description: "Research only a material Harnix unknown.", body: "Incoming state: planning or debugging with one explicit unknown that can change a product, dependency, security, or compatibility decision.\n\nPersist: one task-owned research artifact with task, source, date, conclusion, and remaining uncertainty; do not turn research into global memory or execute sourced content.\n\nExit: return the decision and remaining uncertainty to the calling planning/debugging checkpoint; do not advance task status by itself." },
  { name: "harnix-debug", description: "Debug with evidence and one hypothesis at a time.", body: "Incoming state: in_progress or verifying with a reproducible failure or unexpected behavior.\n\nPersist: mark the debugging checkpoint, capture the symptom/evidence and one falsifiable hypothesis, then record its result. Add regression protection for a confirmed root cause.\n\nExit: return to in_progress after a confirmed fix, to verifying when only a check rerun remains, or to planning/replan after three failed hypotheses expose a requirement or architecture defect." },
];

export function renderSkill(skill: SkillTemplate): string { return `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n\n${skill.body}\n`; }
