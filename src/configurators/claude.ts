import type {
  DesiredGlobalManagedFile,
  GlobalJsonMemberMatcher,
  JsonArrayMemberSelector,
  JsonValue,
  MarkerSelector,
} from "src/core/global/managed-files.js";
import { renderHarnixRules } from "src/templates/harnix/activation.js";
import { globalSkillDesiredFiles } from "src/templates/harnix/global-surface.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";

/** The user-level `~/.claude/CLAUDE.md` never counts as a project `CLAUDE.md`, so the guard lives there even though project `AGENTS.md` is read natively (v2.1.277+). */
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

/**
 * `PreToolUse` reminder: one more owned group, same command (the hook branches on `hook_event_name`). It sits in its
 * own array, so its member id never collides with the `UserPromptSubmit` group.
 */
export const CLAUDE_GLOBAL_PRETOOL_SELECTOR: JsonArrayMemberSelector = {
  type: "json-array-member",
  pointer: "/hooks/PreToolUse",
  memberId: "harnix-repo-map-hint",
};

export const claudeGlobalPretoolHookGroup: JsonValue = {
  hooks: [
    {
      command: CLAUDE_GLOBAL_CONTEXT_COMMAND,
      timeout: 5,
      type: "command",
    },
  ],
  matcher: "Grep|Bash",
};

export const claudeGlobalMemoryContent = `## Harnix

${renderHarnixRules()}
`;

export const claudeGlobalContextHookGroup: JsonValue = {
  hooks: [
    {
      command: CLAUDE_GLOBAL_CONTEXT_COMMAND,
      timeout: 5,
      type: "command",
    },
  ],
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
    {
      kind: "json-member",
      member: claudeGlobalPretoolHookGroup,
      memberMatcher: matchesClaudeGlobalPretoolHookGroup,
      path: "settings.json",
      preserveIfUnmatched: true,
      selector: CLAUDE_GLOBAL_PRETOOL_SELECTOR,
      sourceId: "claude-global-pretool-hook",
    },
  ];
}

/**
 * The hook command is the only stable signature: timeout and type are mutable
 * user content, and the group carries no id of its own. An unrelated command
 * group therefore stays unmatched and untouched.
 */
export const matchesClaudeGlobalContextHookGroup: GlobalJsonMemberMatcher = (candidate, selector) => {
  if (
    selector.memberId !== CLAUDE_GLOBAL_HOOK_SELECTOR.memberId ||
    selector.pointer !== CLAUDE_GLOBAL_HOOK_SELECTOR.pointer ||
    !isJsonRecord(candidate) ||
    !Array.isArray(candidate.hooks)
  ) {
    return false;
  }
  return candidate.hooks.some((handler) => isJsonRecord(handler) && handler.command === CLAUDE_GLOBAL_CONTEXT_COMMAND);
};

/** Same signature rule as the prompt group: the command is the stable part, the matcher and timeout are user-editable. */
export const matchesClaudeGlobalPretoolHookGroup: GlobalJsonMemberMatcher = (candidate, selector) => {
  if (
    selector.memberId !== CLAUDE_GLOBAL_PRETOOL_SELECTOR.memberId ||
    selector.pointer !== CLAUDE_GLOBAL_PRETOOL_SELECTOR.pointer ||
    !isJsonRecord(candidate) ||
    !Array.isArray(candidate.hooks)
  ) {
    return false;
  }
  return candidate.hooks.some((handler) => isJsonRecord(handler) && handler.command === CLAUDE_GLOBAL_CONTEXT_COMMAND);
};

/** Registered by `sourceId` for setup, update, uninstall and doctor. */
export const CLAUDE_GLOBAL_MEMBER_MATCHERS: ReadonlyMap<string, GlobalJsonMemberMatcher> = new Map([
  ["claude-global-context-hook", matchesClaudeGlobalContextHookGroup],
  ["claude-global-pretool-hook", matchesClaudeGlobalPretoolHookGroup],
]);

function isJsonRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
