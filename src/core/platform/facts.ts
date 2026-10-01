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
