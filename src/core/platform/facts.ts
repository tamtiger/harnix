/** Official-source facts that justify each platform record; every fact carries its source and verification date. */
export interface PlatformFact {
  readonly claim: string;
  /** Official source the claim was verified against. */
  readonly source: string;
  /** ISO date (YYYY-MM-DD) of verification. */
  readonly verifiedOn: string;
}

export const KIRO_FACTS: readonly PlatformFact[] = [
  {
    claim:
      "Kiro documents a Prompt Submit hook trigger with command actions; the exact JSON trigger spelling UserPromptSubmit is not quoted on the public page (documented limit)",
    source: "https://kiro.dev/docs/hooks/types/",
    verifiedOn: "2026-10-01",
  },
];

export const ANTIGRAVITY_FACTS: readonly PlatformFact[] = [
  {
    claim:
      "Antigravity hook events are PreToolUse, PostToolUse, PreInvocation, PostInvocation and Stop; PreInvocation takes a flat handler list and may return injectSteps",
    source: "https://antigravity.google/docs/hooks/",
    verifiedOn: "2026-10-01",
  },
];

export const CODEX_FACTS: readonly PlatformFact[] = [
  {
    claim:
      "Codex runs [[hooks.UserPromptSubmit]] from config.toml, and a non-managed hook stays untrusted until reviewed in /hooks",
    source: "https://learn.chatgpt.com/docs/hooks",
    verifiedOn: "2026-10-01",
  },
];

export const CLAUDE_FACTS: readonly PlatformFact[] = [
  {
    claim:
      "Claude Code reads project AGENTS.md natively from v2.1.277 only when no CLAUDE.md exists in or above the working directory; ~/.claude/CLAUDE.md does not count, so the global block stays there",
    source: "https://code.claude.com/docs/en/memory",
    verifiedOn: "2026-10-01",
  },
];

export const OPENCODE_FACTS: readonly PlatformFact[] = [
  {
    claim:
      "OpenCode reads global rules from ~/.config/opencode/AGENTS.md and that file takes precedence over the ~/.claude/CLAUDE.md fallback, so creating it stops the Claude Code prompt fallback (Harnix only owns a marker block inside it)",
    source: "https://opencode.ai/docs/rules",
    verifiedOn: "2026-10-01",
  },
  {
    claim:
      "OpenCode reads skills from the ~/.config/opencode/skills/ directory (plural subdirectory name); OpenCode also resolves the root from XDG_CONFIG_HOME (an absolute value gives $XDG_CONFIG_HOME/opencode; the official page does not name it, a public OpenCode issue, anomalyco/opencode #6669, records the behavior), while OPENCODE_CONFIG names a single config file and OPENCODE_CONFIG_DIR adds an extra custom directory without moving the root (documented limit: XDG support is undocumented upstream)",
    source: "https://opencode.ai/docs/config",
    verifiedOn: "2026-10-05",
  },
];

export const CURSOR_FACTS: readonly PlatformFact[] = [
  {
    claim:
      "Cursor has no global instruction file (User Rules are UI-only; project rules live in .cursor/rules/*.md), so Harnix relies on skills under ~/.cursor/skills/ with no owned instruction file",
    source: "https://cursor.com/docs/hooks",
    verifiedOn: "2026-10-01",
  },
  {
    claim:
      "Cursor user hooks live in ~/.cursor/hooks.json (schema version 1); the sessionStart additional_context output is fire-and-forget and two official forum reports show it is not reliably injected into initial system context, so Harnix stays hookless (sessionStart injection unverified, documented limit) and never uses beforeSubmitPrompt",
    source: "https://cursor.com/docs/hooks",
    verifiedOn: "2026-10-01",
  },
];
