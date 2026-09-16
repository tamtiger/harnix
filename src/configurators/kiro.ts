import type { DesiredGlobalManagedFile } from "../utils/global-managed-files.js";
import { globalSkillDesiredFiles, HARNIX_GLOBAL_ACTIVATION_DOCUMENT } from "../templates/harnix/global-surface.js";

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

export const KIRO_GLOBAL_STEERING = HARNIX_GLOBAL_ACTIVATION_DOCUMENT;

/**
 * Pure, root-relative user-global Kiro plan. The lifecycle supplies the
 * verified ~/.kiro root and owns all filesystem reconciliation.
 */
export function kiroGlobalDesiredFiles(): DesiredGlobalManagedFile[] {
  return [
    ...globalSkillDesiredFiles("kiro-skill"),
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
