import type {
  DesiredGlobalManagedFile,
  GlobalJsonMemberMatcher,
  JsonArrayMemberSelector,
  JsonValue,
  MarkerSelector,
} from "../utils/global-managed-files.js";
import { HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS } from "../templates/harnix/activation.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";

export const CODEX_GLOBAL_AGENTS_SELECTOR: MarkerSelector = { type: "markers", begin, end };
export const CODEX_GLOBAL_HOOK_SELECTOR: JsonArrayMemberSelector = {
  type: "json-array-member",
  pointer: "/hooks/UserPromptSubmit",
  memberId: "harnix-context",
};
export const CODEX_GLOBAL_CONTEXT_COMMAND = "harnix internal context --platform codex";

const codexGlobalSkillGuard = "First locate the nearest ancestor or workspace root containing `.harnix/config.yaml`. Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply Harnix workflow, read project state, or create files.";

export const codexGlobalAgentsContent = `## Harnix

${codexGlobalSkillGuard}

${HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS.join("\n")}

For an initialized Harnix project, read \`.harnix/workflow.md\` and the minimum relevant \`.harnix\` context before acting. Preserve user-owned project files and use fresh verification before completing work. Do not auto-commit, push, or create a pull request.`;

export const codexGlobalContextHookGroup: JsonValue = {
  hooks: [{
    additionalContextLimit: 2500,
    command: CODEX_GLOBAL_CONTEXT_COMMAND,
    timeout: 5,
    type: "command",
  }],
};

export interface CodexGlobalSurfacePlan {
  /** Root-relative files for the global `$HOME/.agents` root. */
  readonly skills: readonly DesiredGlobalManagedFile[];
  /** Root-relative fragments for the global `$CODEX_HOME` root. */
  readonly config: readonly DesiredGlobalManagedFile[];
}

/**
 * Produces no absolute paths and performs no I/O. G7 maps each set to its
 * corresponding verified user root and global ownership manifest.
 */
export function createCodexGlobalSurfacePlan(): CodexGlobalSurfacePlan {
  return {
    config: [
      {
        content: codexGlobalAgentsContent,
        kind: "managed-block",
        path: "AGENTS.md",
        selector: CODEX_GLOBAL_AGENTS_SELECTOR,
        sourceId: "codex-global-agents",
      },
      {
        kind: "json-member",
        member: codexGlobalContextHookGroup,
        memberMatcher: matchesCodexGlobalContextHookGroup,
        preserveIfUnmatched: true,
        path: "hooks.json",
        selector: CODEX_GLOBAL_HOOK_SELECTOR,
        sourceId: "codex-global-context-hook",
      },
    ],
    skills: workflowSkills.map((skill) => ({
      content: renderCodexGlobalSkill(skill),
      kind: "file" as const,
      path: `skills/${skill.name}/SKILL.md`,
      sourceId: `codex-global-skill-${skill.name}`,
    })),
  };
}

/**
 * A stable structural signature for the Harnix group. Command, timeout, and
 * hook type are mutable user content, so any one of the fixed command or the
 * Harnix-specific context-limit marker is enough to identify the group for
 * preservation. This prevents an edited owned group from being re-added as a
 * duplicate while ordinary command groups remain unrelated.
 */
export const matchesCodexGlobalContextHookGroup: GlobalJsonMemberMatcher = (candidate, selector) => {
  if (selector.memberId !== CODEX_GLOBAL_HOOK_SELECTOR.memberId || selector.pointer !== CODEX_GLOBAL_HOOK_SELECTOR.pointer || !isJsonRecord(candidate) || !Array.isArray(candidate.hooks)) {
    return false;
  }
  return candidate.hooks.some((handler) => isJsonRecord(handler)
    && typeof handler.command === "string"
    && (handler.command === CODEX_GLOBAL_CONTEXT_COMMAND || handler.additionalContextLimit === 2500));
};

function renderCodexGlobalSkill(skill: (typeof workflowSkills)[number]): string {
  return renderSkill(skill);
}

function isJsonRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
