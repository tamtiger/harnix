import { describe, expect, it } from "vitest";

import {
  ANTIGRAVITY_GLOBAL_CONTEXT_HOOK,
  ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND,
  ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST,
  ANTIGRAVITY_GLOBAL_RULE,
  antigravityGlobalPluginDesiredFiles,
} from "src/configurators/antigravity.js";
import {
  KIRO_GLOBAL_CONTEXT_HOOK,
  KIRO_GLOBAL_CONTEXT_HOOK_COMMAND,
  KIRO_GLOBAL_STEERING,
  kiroGlobalDesiredFiles,
} from "src/configurators/kiro.js";
import { canonicalSkills, renderSkill } from "src/templates/harnix/workflow.js";
import { renderHarnixRules } from "src/templates/harnix/activation.js";
import { codexGlobalAgentsContent, createCodexGlobalSurfacePlan } from "src/configurators/codex.js";
import type { DesiredGlobalManagedFile } from "src/core/global/managed-files.js";

function fileContent(file: DesiredGlobalManagedFile | undefined): string {
  if (file?.kind !== "file") {
    throw new Error("Expected a whole-file global desired entry.");
  }
  return file.content;
}

const skillPaths = canonicalSkills.flatMap((skill) => [
  `skills/${skill.name}/SKILL.md`,
  ...Object.keys(skill.references).map((topic) => `skills/${skill.name}/references/${topic}.md`),
]);

describe("user-global platform desired-surface renderers", () => {
  it("should_render_language_independent_kiro_global_surfaces_when_setup_has_no_project_context", () => {
    const first = kiroGlobalDesiredFiles();
    const second = kiroGlobalDesiredFiles();
    const byPath = new Map(first.map((file) => [file.path, file]));

    expect(second).toEqual(first);
    expect(first).toHaveLength(skillPaths.length + 2);
    expect(first.every((file) => file.kind === "file")).toBe(true);
    expect(first.map((file) => file.path)).toEqual([...skillPaths, "steering/harnix.md", "hooks/harnix-context.json"]);
    expect(KIRO_GLOBAL_CONTEXT_HOOK_COMMAND).toBe("harnix context --platform kiro");
    expect(KIRO_GLOBAL_CONTEXT_HOOK).toEqual({
      version: "v1",
      hooks: [
        {
          name: "harnix-context",
          trigger: "UserPromptSubmit",
          action: { type: "command", command: KIRO_GLOBAL_CONTEXT_HOOK_COMMAND },
          timeout: 5,
          enabled: true,
        },
      ],
    });
    expect(JSON.parse(fileContent(byPath.get("hooks/harnix-context.json")))).toEqual(KIRO_GLOBAL_CONTEXT_HOOK);
    expect(fileContent(byPath.get("steering/harnix.md"))).toBe(KIRO_GLOBAL_STEERING);
    expect(KIRO_GLOBAL_STEERING).toContain("nearest ancestor with a valid");
    expect(KIRO_GLOBAL_STEERING).toContain(".harnix/config.yaml");
    expect(KIRO_GLOBAL_STEERING).not.toContain("Detected languages:");
  });

  it("should_render_the_same_harnix_rules_on_every_always_loaded_surface_and_keep_skills_free_of_them", () => {
    const kiroSkills = kiroGlobalDesiredFiles().filter((file) => file.path.startsWith("skills/"));
    const antigravity = antigravityGlobalPluginDesiredFiles();
    const antigravitySkills = antigravity.filter((file) => file.path.startsWith("skills/"));

    expect(kiroSkills).toHaveLength(skillPaths.length);
    for (const skill of [...kiroSkills, ...antigravitySkills]) {
      if (skill.path.endsWith("SKILL.md")) {
        expect(fileContent(skill)).toContain("name: harnix-");
      }
      expect(fileContent(skill)).not.toContain("## Harnix rules");
      expect(fileContent(skill)).not.toContain("C:\\");
    }
    expect(ANTIGRAVITY_GLOBAL_RULE).toMatch(/^# Harnix\n/u);
    expect(ANTIGRAVITY_GLOBAL_RULE).not.toMatch(/^---\n/u);
    for (const surface of [ANTIGRAVITY_GLOBAL_RULE, KIRO_GLOBAL_STEERING]) {
      expect(surface).toContain("## Harnix rules");
      expect(surface).toContain(renderHarnixRules());
      expect(surface).toContain(".harnix/config.yaml");
      expect(surface).toContain("nearest ancestor with a valid `.harnix/config.yaml`");
    }
  });

  it("should_route_ordinary_requests_without_requiring_the_user_to_name_harnix", () => {
    for (const instructions of [KIRO_GLOBAL_STEERING, ANTIGRAVITY_GLOBAL_RULE, codexGlobalAgentsContent]) {
      expect(instructions).toContain(renderHarnixRules());
      expect(instructions.indexOf("classify the latest request")).toBeLessThan(
        instructions.indexOf("before reading any active task") + 1,
      );
      expect(instructions).toContain("leaves an unrelated active task unchanged");
      expect(instructions).toContain("workflow --preflight");
      expect(instructions).toContain("if none exists or its state is invalid");
    }
  });

  it("should_render_byte-identical_canonical_skill_sources_for_every_platform", () => {
    const expected = new Map(canonicalSkills.map((skill) => [`skills/${skill.name}/SKILL.md`, renderSkill(skill)]));
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

  it("should_keep_stable_per_platform_skill_source_ids_when_the_shared_plan_is_reused", () => {
    const platforms: readonly (readonly [string, readonly DesiredGlobalManagedFile[]])[] = [
      ["kiro-skill", kiroGlobalDesiredFiles()],
      ["antigravity-skill", antigravityGlobalPluginDesiredFiles()],
      ["codex-global-skill", [...createCodexGlobalSurfacePlan().skills]],
    ];

    for (const [prefix, files] of platforms) {
      const skills = files.filter((file) => file.path.startsWith("skills/"));

      const expectedSourceIds = canonicalSkills.flatMap((skill) => [
        `${prefix}-${skill.name}`,
        ...Object.keys(skill.references).map((topic) => `${prefix}-${skill.name}-ref-${topic}`),
      ]);
      expect(skills.map((file) => file.sourceId)).toEqual(expectedSourceIds);
      expect(skills.map((file) => file.path)).toEqual(skillPaths);
    }
  });

  it("should_render_identical_root_relative_antigravity_plugin_when_reused_for_desktop_and_cli", () => {
    const desktopPlan = antigravityGlobalPluginDesiredFiles();
    const cliPlan = antigravityGlobalPluginDesiredFiles();
    const byPath = new Map(desktopPlan.map((file) => [file.path, file]));

    expect(cliPlan).toEqual(desktopPlan);
    expect(desktopPlan).toHaveLength(skillPaths.length + 3);
    expect(desktopPlan.every((file) => file.kind === "file")).toBe(true);
    expect(desktopPlan.map((file) => file.path)).toEqual([
      "plugin.json",
      ...skillPaths,
      "rules/AGENTS.md",
      "hooks.json",
    ]);
    expect(ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST).toEqual({ name: "harnix" });
    expect(JSON.parse(fileContent(byPath.get("plugin.json")))).toEqual(ANTIGRAVITY_GLOBAL_PLUGIN_MANIFEST);
    expect(ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND).toBe("harnix context --platform antigravity");
    expect(ANTIGRAVITY_GLOBAL_CONTEXT_HOOK).toEqual({
      "harnix-context": {
        PreInvocation: [
          {
            type: "command",
            command: ANTIGRAVITY_GLOBAL_CONTEXT_HOOK_COMMAND,
            timeout: 5,
          },
        ],
      },
    });
    expect(JSON.parse(fileContent(byPath.get("hooks.json")))).toEqual(ANTIGRAVITY_GLOBAL_CONTEXT_HOOK);
    expect(fileContent(byPath.get("rules/AGENTS.md"))).toBe(ANTIGRAVITY_GLOBAL_RULE);
    expect(desktopPlan.map((file) => file.path).some((path) => path.startsWith("/") || path.includes(".."))).toBe(
      false,
    );
  });
});
