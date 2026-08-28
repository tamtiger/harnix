import type { DesiredGlobalManagedFile } from "../utils/global-managed-files.js";
import { HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS, HARNIX_TARGET_AUTHORITY_INSTRUCTIONS } from "../templates/harnix/activation.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";

export const KIRO_GLOBAL_CONTEXT_HOOK_COMMAND = "harnix context --platform kiro";

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
  ...HARNIX_TARGET_AUTHORITY_INSTRUCTIONS,
  ...HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS,
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
      content: renderSkill(skill),
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
