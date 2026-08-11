import type { DesiredGlobalManagedFile } from "../utils/global-managed-files.js";
import { type SkillTemplate, workflowSkills } from "../templates/harnix/workflow.js";

export const KIRO_GLOBAL_CONTEXT_HOOK_COMMAND = "harnix internal context --platform kiro";

export const KIRO_GLOBAL_CONTEXT_HOOK = {
  version: "v1",
  hooks: [{
    name: "harnix-context",
    trigger: "UserPromptSubmit",
    action: {
      type: "command",
      command: KIRO_GLOBAL_CONTEXT_HOOK_COMMAND,
    },
    timeout: 5,
    enabled: true,
  }],
} as const;

export const KIRO_GLOBAL_STEERING = [
  "# Harnix",
  "",
  "## Harnix activation guard",
  "",
  "First locate the nearest ancestor or workspace root containing .harnix/config.yaml.",
  "Apply this steering only when that root exists and its Harnix state is valid; then read .harnix/workflow.md and use the installed Harnix skills with bounded project context.",
  "If no such root exists or its state is invalid, do not apply the Harnix workflow, create Harnix state, or run harnix init.",
  "",
].join("\n");

/**
 * Pure, root-relative user-global Kiro plan. The lifecycle supplies the
 * verified ~/.kiro root and owns all filesystem reconciliation.
 */
export function kiroGlobalDesiredFiles(): DesiredGlobalManagedFile[] {
  return [
    ...workflowSkills.map((skill): DesiredGlobalManagedFile => ({
      path: "skills/" + skill.name + "/SKILL.md",
      sourceId: "kiro-skill-" + skill.name,
      kind: "file",
      content: renderGlobalSkill(skill),
    })),
    {
      path: "steering/harnix.md",
      sourceId: "kiro-steering",
      kind: "file",
      content: KIRO_GLOBAL_STEERING,
    },
    {
      path: "hooks/harnix-context.json",
      sourceId: "kiro-context-hook",
      kind: "file",
      content: JSON.stringify(KIRO_GLOBAL_CONTEXT_HOOK, null, 2) + "\n",
    },
  ];
}

function renderGlobalSkill(skill: SkillTemplate): string {
  return [
    "---",
    "name: " + skill.name,
    "description: " + skill.description,
    "---",
    "",
    "## Harnix activation guard",
    "",
    "First locate the nearest ancestor or workspace root containing .harnix/config.yaml.",
    "Apply this skill only when that root exists and its Harnix state is valid.",
    "If no such root exists or its state is invalid, do not apply the Harnix workflow, create Harnix state, or run harnix init.",
    "",
    skill.body,
    "",
  ].join("\n");
}
