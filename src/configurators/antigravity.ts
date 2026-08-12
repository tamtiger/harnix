import type { DesiredGlobalManagedFile } from "../utils/global-managed-files.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";

export const ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND = "harnix internal context --platform antigravity";

/** The official plugin marker schema accepts this namespaced name and no extra fields. */
export const ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST = { name: "harnix" } as const;

export const ANTIGRAVITY_GLOBAL_CONTEXT_HOOK = {
  "harnix-context": {
    PreInvocation: [{
      type: "command",
      command: ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND,
      timeout: 5,
    }],
  },
} as const;

export const ANTIGRAVITY_GLOBAL_RULE = [
  "# Harnix",
  "",
  "## Harnix activation guard",
  "",
  "First locate the nearest ancestor or workspace root containing .harnix/config.yaml.",
  "Apply this rule only when that root exists and its Harnix state is valid; then read .harnix/workflow.md and follow the matching Harnix skill with bounded context.",
  "If no such root exists or its state is invalid, do not apply the Harnix workflow, create Harnix state, or run harnix init.",
  "",
].join("\n");

/**
 * Pure plugin plan shared unchanged by the Desktop and CLI plugin roots. The
 * user-global lifecycle supplies the verified root and performs reconciliation.
 */
export function antigravityGlobalPluginDesiredFiles(): DesiredGlobalManagedFile[] {
  return [
    {
      path: "plugin.json",
      sourceId: "antigravity-plugin-manifest",
      kind: "file",
      content: JSON.stringify(ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST, null, 2) + "\n",
    },
    ...workflowSkills.map((skill): DesiredGlobalManagedFile => ({
      path: "skills/" + skill.name + "/SKILL.md",
      sourceId: "antigravity-skill-" + skill.name,
      kind: "file",
      content: renderSkill(skill),
    })),
    {
      path: "rules/harnix.md",
      sourceId: "antigravity-global-rule",
      kind: "file",
      content: ANTIGRAVITY_GLOBAL_RULE,
    },
    {
      path: "hooks.json",
      sourceId: "antigravity-context-hook",
      kind: "file",
      content: JSON.stringify(ANTIGRAVITY_GLOBAL_CONTEXT_HOOK, null, 2) + "\n",
    },
  ];
}
