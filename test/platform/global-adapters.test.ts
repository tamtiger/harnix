import { describe, expect, it } from "vitest";

import {
  ANTIGRAVITY_GLOBAL_CONTEXT_HOOK,
  ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND,
  ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST,
  ANTIGRAVITY_GLOBAL_RULE,
  antigravityGlobalPluginDesiredFiles,
} from "../../src/configurators/antigravity.js";
import {
  KIRO_GLOBAL_CONTEXT_HOOK,
  KIRO_GLOBAL_CONTEXT_HOOK_COMMAND,
  KIRO_GLOBAL_STEERING,
  kiroGlobalDesiredFiles,
} from "../../src/configurators/kiro.js";
import { renderSkill, workflowSkills } from "../../src/templates/harnix/workflow.js";
import { codexGlobalAgentsContent, createCodexGlobalSurfacePlan } from "../../src/configurators/codex.js";
import type { DesiredGlobalManagedFile } from "../../src/utils/global-managed-files.js";

function fileContent(file: DesiredGlobalManagedFile | undefined): string {
  if (file?.kind !== "file") {
    throw new Error("Expected a whole-file global desired entry.");
  }
  return file.content;
}

describe("user-global platform desired-surface renderers", () => {
  const implicitActivationInstruction = "apply this workflow to every ordinary user request even when the user does not mention Harnix";

  it("should_render_language_independent_kiro_global_surfaces_when_setup_has_no_project_context", () => {
    const first = kiroGlobalDesiredFiles();
    const second = kiroGlobalDesiredFiles();
    const byPath = new Map(first.map((file) => [file.path, file]));

    expect(second).toEqual(first);
    expect(first).toHaveLength(workflowSkills.length + 2);
    expect(first.every((file) => file.kind === "file")).toBe(true);
    expect(first.map((file) => file.path)).toEqual([
      ...workflowSkills.map((skill) => `skills/${skill.name}/SKILL.md`),
      "steering/harnix.md",
      "hooks/harnix-context.json",
    ]);
    expect(KIRO_GLOBAL_CONTEXT_HOOK_COMMAND).toBe("harnix internal context --platform kiro");
    expect(KIRO_GLOBAL_CONTEXT_HOOK).toEqual({
      version: "v1",
      hooks: [{
        name: "harnix-context",
        trigger: "UserPromptSubmit",
        action: { type: "command", command: KIRO_GLOBAL_CONTEXT_HOOK_COMMAND },
        timeout: 5,
        enabled: true,
      }],
    });
    expect(JSON.parse(fileContent(byPath.get("hooks/harnix-context.json")))).toEqual(KIRO_GLOBAL_CONTEXT_HOOK);
    expect(fileContent(byPath.get("steering/harnix.md"))).toBe(KIRO_GLOBAL_STEERING);
    expect(KIRO_GLOBAL_STEERING).toContain("only when");
    expect(KIRO_GLOBAL_STEERING).toContain(".harnix/config.yaml");
    expect(KIRO_GLOBAL_STEERING).not.toContain("Detected languages:");
  });

  it("should_include_activation_guard_when_rendering_global_skills_and_rules", () => {
    const kiroSkills = kiroGlobalDesiredFiles().filter((file) => file.path.startsWith("skills/"));
    const antigravity = antigravityGlobalPluginDesiredFiles();
    const antigravitySkills = antigravity.filter((file) => file.path.startsWith("skills/"));

    expect(kiroSkills).toHaveLength(workflowSkills.length);
    for (const skill of [...kiroSkills, ...antigravitySkills]) {
      expect(fileContent(skill)).toContain("## Harnix activation guard");
      expect(fileContent(skill)).toContain(".harnix/config.yaml");
      expect(fileContent(skill)).toContain("nearest ancestor or workspace root");
      expect(fileContent(skill)).toContain("no such root exists or its state is invalid");
      expect(fileContent(skill)).not.toContain("C:\\");
    }
    expect(ANTIGRAVITY_GLOBAL_RULE).toContain("## Harnix activation guard");
    expect(ANTIGRAVITY_GLOBAL_RULE).toMatch(/^# Harnix\n/u);
    expect(ANTIGRAVITY_GLOBAL_RULE).not.toMatch(/^---\n/u);
    expect(ANTIGRAVITY_GLOBAL_RULE).toContain(".harnix/config.yaml");
    expect(ANTIGRAVITY_GLOBAL_RULE).toContain("nearest ancestor or workspace root");
    expect(ANTIGRAVITY_GLOBAL_RULE).toContain("no such root exists or its state is invalid");
    expect(KIRO_GLOBAL_STEERING).toContain("nearest ancestor or workspace root");
    expect(KIRO_GLOBAL_STEERING).toContain("no such root exists or its state is invalid");
  });

  it("should_route_ordinary_requests_without_requiring_the_user_to_name_harnix", () => {
    for (const instructions of [KIRO_GLOBAL_STEERING, ANTIGRAVITY_GLOBAL_RULE, codexGlobalAgentsContent]) {
      expect(instructions).toContain(implicitActivationInstruction);
      expect(instructions).toContain("classify the request as Bypass, Lite, or Full before acting");
      expect(instructions).toContain("If no such root exists or its state is invalid");
    }
  });

  it("should_render_byte-identical_canonical_skill_sources_for_every_platform", () => {
    const expected = new Map(workflowSkills.map((skill) => [`skills/${skill.name}/SKILL.md`, renderSkill(skill)]));
    const platforms = [
      kiroGlobalDesiredFiles(),
      antigravityGlobalPluginDesiredFiles(),
      [...createCodexGlobalSurfacePlan().skills],
    ];

    for (const files of platforms) {
      for (const [path, content] of expected) {
        expect(fileContent(files.find((file) => file.path === path))).toBe(content);
      }
    }
  });

  it("should_render_identical_root_relative_antigravity_plugin_when_reused_for_desktop_and_cli", () => {
    const desktopPlan = antigravityGlobalPluginDesiredFiles();
    const cliPlan = antigravityGlobalPluginDesiredFiles();
    const byPath = new Map(desktopPlan.map((file) => [file.path, file]));

    expect(cliPlan).toEqual(desktopPlan);
    expect(desktopPlan).toHaveLength(workflowSkills.length + 3);
    expect(desktopPlan.every((file) => file.kind === "file")).toBe(true);
    expect(desktopPlan.map((file) => file.path)).toEqual([
      "plugin.json",
      ...workflowSkills.map((skill) => `skills/${skill.name}/SKILL.md`),
      "rules/AGENTS.md",
      "hooks.json",
    ]);
    expect(ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST).toEqual({ name: "harnix" });
    expect(JSON.parse(fileContent(byPath.get("plugin.json")))).toEqual(ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST);
    expect(ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND).toBe("harnix internal context --platform antigravity");
    expect(ANTIGRAVITY_GLOBAL_CONTEXT_HOOK).toEqual({
      "harnix-context": {
        PreInvocation: [{
          type: "command",
          command: ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND,
          timeout: 5,
        }],
      },
    });
    expect(JSON.parse(fileContent(byPath.get("hooks.json")))).toEqual(ANTIGRAVITY_GLOBAL_CONTEXT_HOOK);
    expect(fileContent(byPath.get("rules/AGENTS.md"))).toBe(ANTIGRAVITY_GLOBAL_RULE);
    expect(desktopPlan.map((file) => file.path).some((path) => path.startsWith("/") || path.includes(".."))).toBe(false);
  });
});
