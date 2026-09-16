import { describe, expect, it } from "vitest";

import {
  CLAUDE_GLOBAL_CONTEXT_COMMAND,
  CLAUDE_GLOBAL_HOOK_SELECTOR,
  CLAUDE_GLOBAL_MEMORY_SELECTOR,
  claudeGlobalContextHookGroup,
  claudeGlobalDesiredFiles,
  claudeGlobalMemoryContent,
  matchesClaudeGlobalContextHookGroup,
} from "../../src/configurators/claude.js";
import { HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS } from "../../src/templates/harnix/activation.js";
import { renderSkill, workflowSkills } from "../../src/templates/harnix/workflow.js";
import type { DesiredGlobalManagedFile } from "../../src/utils/global-managed-files.js";

function entry(files: readonly DesiredGlobalManagedFile[], path: string): DesiredGlobalManagedFile {
  const found = files.find((file) => file.path === path);
  if (found === undefined) throw new Error(`Missing desired entry for ${path}.`);
  return found;
}

describe("claude user-global desired surface", () => {
  it("should_plan_only_the_three_owned_claude_fragments_when_setup_has_no_project_context", () => {
    const first = claudeGlobalDesiredFiles();
    const second = claudeGlobalDesiredFiles();

    expect(second).toEqual(first);
    expect(first).toHaveLength(workflowSkills.length + 2);
    expect(first.map((file) => file.path)).toEqual([
      ...workflowSkills.map((skill) => `skills/${skill.name}/SKILL.md`),
      "CLAUDE.md",
      "settings.json",
    ]);
    expect(first.map((file) => file.path).some((path) => path.startsWith("/") || path.includes(".."))).toBe(false);
    expect(first.map((file) => file.path)).not.toContain(".claude.json");
  });

  it("should_render_byte_identical_canonical_skills_for_claude", () => {
    const files = claudeGlobalDesiredFiles();

    for (const skill of workflowSkills) {
      const file = entry(files, `skills/${skill.name}/SKILL.md`);

      expect(file.kind).toBe("file");
      expect(file.sourceId).toBe(`claude-skill-${skill.name}`);
      expect(file.kind === "file" ? file.content : "").toBe(renderSkill(skill));
    }
  });

  it("should_own_a_marked_block_in_user_memory_rather_than_the_whole_claude_md", () => {
    const memory = entry(claudeGlobalDesiredFiles(), "CLAUDE.md");

    expect(memory.kind).toBe("managed-block");
    expect(memory.kind === "managed-block" ? memory.selector : undefined).toEqual(CLAUDE_GLOBAL_MEMORY_SELECTOR);
    expect(CLAUDE_GLOBAL_MEMORY_SELECTOR).toEqual({ type: "markers", begin: "<!-- harnix:begin -->", end: "<!-- harnix:end -->" });
    for (const clause of HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS) expect(claudeGlobalMemoryContent).toContain(clause);
    expect(claudeGlobalMemoryContent).toContain(".harnix/config.yaml");
    expect(claudeGlobalMemoryContent).toContain("Do not auto-commit");
    expect(claudeGlobalMemoryContent).not.toContain("C:\\");
  });

  it("should_own_one_user_prompt_submit_hook_member_in_settings_json", () => {
    const settings = entry(claudeGlobalDesiredFiles(), "settings.json");

    expect(settings.kind).toBe("json-member");
    expect(settings.kind === "json-member" ? settings.selector : undefined).toEqual(CLAUDE_GLOBAL_HOOK_SELECTOR);
    expect(CLAUDE_GLOBAL_HOOK_SELECTOR).toEqual({ type: "json-array-member", pointer: "/hooks/UserPromptSubmit", memberId: "harnix-context" });
    expect(CLAUDE_GLOBAL_CONTEXT_COMMAND).toBe("harnix context --platform claude");
    expect(claudeGlobalContextHookGroup).toEqual({
      hooks: [{ command: CLAUDE_GLOBAL_CONTEXT_COMMAND, timeout: 5, type: "command" }],
    });
    expect(claudeGlobalContextHookGroup).not.toHaveProperty("matcher");
  });

  it("should_identify_only_the_harnix_hook_group_when_matching_existing_settings_members", () => {
    expect(matchesClaudeGlobalContextHookGroup(claudeGlobalContextHookGroup, CLAUDE_GLOBAL_HOOK_SELECTOR)).toBe(true);
    expect(matchesClaudeGlobalContextHookGroup(
      { hooks: [{ type: "command", command: CLAUDE_GLOBAL_CONTEXT_COMMAND, timeout: 30 }] },
      CLAUDE_GLOBAL_HOOK_SELECTOR,
    )).toBe(true);
    expect(matchesClaudeGlobalContextHookGroup(
      { hooks: [{ type: "command", command: "pnpm lint" }] },
      CLAUDE_GLOBAL_HOOK_SELECTOR,
    )).toBe(false);
    expect(matchesClaudeGlobalContextHookGroup({ hooks: "not-an-array" }, CLAUDE_GLOBAL_HOOK_SELECTOR)).toBe(false);
    expect(matchesClaudeGlobalContextHookGroup(
      claudeGlobalContextHookGroup,
      { type: "json-array-member", pointer: "/hooks/PreToolUse", memberId: "harnix-context" },
    )).toBe(false);
  });
});
