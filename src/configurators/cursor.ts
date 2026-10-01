import type { DesiredGlobalManagedFile } from "src/core/global/managed-files.js";
import { globalSkillDesiredFiles } from "src/templates/harnix/global-surface.js";

/**
 * Root-relative plan for the single `~/.cursor` root. Cursor has no global
 * instruction file (User Rules are UI-only; project rules live in
 * `.cursor/rules/*.md`) and its `sessionStart` hook injection is unverified
 * (cursor.com/docs/hooks), so Harnix installs only the canonical skill files
 * under `~/.cursor/skills/` and runs hookless. No `hooks.json` is written.
 */
export function cursorGlobalDesiredFiles(): DesiredGlobalManagedFile[] {
  return [...globalSkillDesiredFiles("cursor-skill")];
}
