export const workflowTemplate = `# Harnix workflow

This workflow applies only to a project whose current workspace has \`.harnix/config.yaml\`. If the guard is absent or invalid, do not create files or automatically run \`harnix init\`; report the missing or invalid state. Platform setup is a separate, explicit user-global operation and does not create platform integration surfaces in this project.

Use one active task and the canonical sequence: planning → ready → in_progress → verifying → completed. A task may be blocked and resumes only to its recorded status. Treat debugging, replan, and finishing as checkpoints.

Before implementation, record acceptance criteria, relevant paths, and a validation plan. Use focused fresh evidence; compliance review comes before quality/security review. Do not commit, branch, push, merge, or create a PR.
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
