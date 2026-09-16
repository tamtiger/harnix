import type {
  DesiredGlobalManagedFile,
  GlobalJsonMemberMatcher,
  JsonArrayMemberSelector,
  JsonValue,
  MarkerSelector,
} from "../utils/global-managed-files.js";
import { HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS, HARNIX_TARGET_AUTHORITY_INSTRUCTIONS } from "../templates/harnix/activation.js";
import { globalSkillDesiredFiles } from "../templates/harnix/global-surface.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";

/** Claude Code reads `CLAUDE.md`, not `AGENTS.md`, so the guard lives there. */
export const CLAUDE_GLOBAL_MEMORY_SELECTOR: MarkerSelector = { type: "markers", begin, end };

/**
 * `UserPromptSubmit` groups have no matcher support, so the handler array is
 * the only structural member. Harnix owns exactly one group inside it.
 */
export const CLAUDE_GLOBAL_HOOK_SELECTOR: JsonArrayMemberSelector = {
  type: "json-array-member",
  pointer: "/hooks/UserPromptSubmit",
  memberId: "harnix-context",
};

export const CLAUDE_GLOBAL_CONTEXT_COMMAND = "harnix context --platform claude";

export const claudeGlobalMemoryContent = `## Harnix

${HARNIX_TARGET_AUTHORITY_INSTRUCTIONS.join("\n")}

${HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS.join("\n")}

Only after a request is classified as project-scoped Lite/Full or explicitly asks to inspect/continue Harnix work, read \`.harnix/workflow.md\` and the minimum relevant \`.harnix\` context. Obvious Bypass does not load unrelated workflow/task state. Preserve user-owned project files and use fresh verification before completing work. Do not auto-commit, push, or create a pull request.`;

export const claudeGlobalContextHookGroup: JsonValue = {
  hooks: [{
    command: CLAUDE_GLOBAL_CONTEXT_COMMAND,
    timeout: 5,
    type: "command",
  }],
};

/**
 * Root-relative plan for the single `~/.claude` root. Harnix owns only the
 * skill files, one marked block in user memory, and one hook group; the
 * sign-in session, MCP servers, and project state Claude Code keeps for itself
 * are never part of this plan.
 */
export function claudeGlobalDesiredFiles(): DesiredGlobalManagedFile[] {
  return [
    ...globalSkillDesiredFiles("claude-skill"),
    {
      content: claudeGlobalMemoryContent,
      kind: "managed-block",
      path: "CLAUDE.md",
      selector: CLAUDE_GLOBAL_MEMORY_SELECTOR,
      sourceId: "claude-global-memory",
    },
    {
      kind: "json-member",
      member: claudeGlobalContextHookGroup,
      memberMatcher: matchesClaudeGlobalContextHookGroup,
      path: "settings.json",
      preserveIfUnmatched: true,
      selector: CLAUDE_GLOBAL_HOOK_SELECTOR,
      sourceId: "claude-global-context-hook",
    },
  ];
}

/**
 * The hook command is the only stable signature: timeout and type are mutable
 * user content, and the group carries no id of its own. An unrelated command
 * group therefore stays unmatched and untouched.
 */
export const matchesClaudeGlobalContextHookGroup: GlobalJsonMemberMatcher = (candidate, selector) => {
  if (selector.memberId !== CLAUDE_GLOBAL_HOOK_SELECTOR.memberId || selector.pointer !== CLAUDE_GLOBAL_HOOK_SELECTOR.pointer || !isJsonRecord(candidate) || !Array.isArray(candidate.hooks)) {
    return false;
  }
  return candidate.hooks.some((handler) => isJsonRecord(handler) && handler.command === CLAUDE_GLOBAL_CONTEXT_COMMAND);
};

function isJsonRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
