import type { DesiredGlobalManagedFile, MarkerSelector } from "src/core/global/managed-files.js";
import { renderHarnixRules } from "src/templates/harnix/activation.js";
import { globalSkillDesiredFiles } from "src/templates/harnix/global-surface.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";

export const OPENCODE_GLOBAL_AGENTS_SELECTOR: MarkerSelector = { type: "markers", begin, end };

export const opencodeGlobalAgentsContent = `## Harnix

${renderHarnixRules()}
`;

/**
 * Root-relative plan for the single `~/.config/opencode` root. OpenCode reads a
 * whole global `AGENTS.md` and that file takes precedence over the
 * `~/.claude/CLAUDE.md` fallback (opencode.ai/docs/rules), so Harnix owns only a
 * marked block inside it, preserving any user content around the block. OpenCode
 * exposes no user-global shell hook, so the platform is hookless; the skills live
 * under the native `~/.config/opencode/skills/` directory.
 */
export function opencodeGlobalDesiredFiles(): DesiredGlobalManagedFile[] {
  return [
    ...globalSkillDesiredFiles("opencode-skill"),
    {
      content: opencodeGlobalAgentsContent,
      kind: "managed-block",
      path: "AGENTS.md",
      selector: OPENCODE_GLOBAL_AGENTS_SELECTOR,
      sourceId: "opencode-global-agents",
    },
  ];
}
