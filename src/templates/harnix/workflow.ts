export const workflowTemplate = `# Harnix workflow

This workflow applies only after locating the nearest initialized project ancestor or workspace root containing \`.harnix/config.yaml\`. If no such root exists or its state is invalid, do not create files or automatically run \`harnix init\`; report the missing or invalid state. Platform setup is a separate, explicit user-global operation and does not create platform integration surfaces in this project.

## Route the request

- **Bypass:** read-only explanation or a trivial action that does not need persisted task state.
- **Lite:** localized, low-risk implementation with clear scope; persist a compact task record.
- **Full:** cross-layer, security-sensitive, migration-heavy, or materially uncertain work; persist PRD/plan and targeted research when needed.

Use one active task and the canonical sequence: planning → ready → in_progress → verifying → completed. A task may be blocked only by a concrete decision, authority, credential, external dependency, or repository condition, and resumes only to its recorded status. Debugging, replan, and finishing are checkpoints, not alternate workflows.

## Ready gate

Before implementation, record the goal, non-goals, acceptance criteria, relevant paths/specs, and a validation plan. Resolve material product decisions first. A clear user request to implement authorizes work within that scope; ask again only for a new decision, authority, destructive/external action, or material scope expansion.

## Implement and verify

For behavior changes, prefer RED → GREEN → REFACTOR: reproduce with a focused failing test, make the smallest coherent change, then refactor while green. Preserve unrelated/user-owned content and load only task-relevant context.

Verification has two ordered stages: (1) compliance with the request, PRD/spec, and acceptance criteria; (2) correctness, tests, security, maintainability, and unnecessary complexity. Use fresh focused evidence before the required broader gate. Record actual failures and omitted checks; never infer success from stale or partial output.

Finish only when every criterion is met or explicitly waived with a reason, required evidence is fresh, and persisted state is updated safely. Do not commit, branch, push, merge, publish, or create a PR automatically.
`;

export interface SkillTemplate { name: string; description: string; body: string; }
export const workflowSkills: SkillTemplate[] = [
  { name: "harnix-brainstorm", description: "Route a request and establish a ready Harnix task.", body: "Classify Bypass, Lite, or Full. Record goal, non-goals, acceptance criteria, relevant scope, and validation plan before moving to ready. Full tasks also record a material-unknown research decision and a decision-complete plan." },
  { name: "harnix-implement", description: "Implement a ready Harnix task with focused evidence.", body: "Load the smallest relevant context. For behavior changes use RED–GREEN–REFACTOR; record a reason and alternate verification for documented exceptions." },
  { name: "harnix-check", description: "Verify a Harnix task with fresh evidence.", body: "Run compliance checks before quality/security checks. Partial or stale output cannot complete a task." },
  { name: "harnix-finish-work", description: "Finish a verified Harnix task.", body: "Require fresh verification, journal the evidence, and archive the active task. Never commit, push, merge, or create a PR." },
  { name: "harnix-continue", description: "Resume the persisted Harnix task safely.", body: "Load task record, checkpoint, evidence, and the minimum context. Fail closed for corrupt or future task state." },
  { name: "harnix-research", description: "Research only a material Harnix unknown.", body: "Research only when an unknown can affect a decision. Record source, date, task, conclusion, and remaining uncertainty." },
  { name: "harnix-debug", description: "Debug with evidence and one hypothesis at a time.", body: "Reproduce, gather evidence, identify root cause, test one hypothesis, add regression protection, and reassess architecture after three failed hypotheses." },
];

export function renderSkill(skill: SkillTemplate): string { return `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n\n${skill.body}\n`; }
