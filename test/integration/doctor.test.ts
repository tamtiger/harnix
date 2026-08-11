import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseProject } from "../../src/commands/doctor.js";
import { initializeProject } from "../../src/commands/init.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { readConfig, writeConfig } from "../../src/core/config/config.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-");
const approvedHook = { command: "harnix internal context --platform codex", commandWindows: "harnix.exe internal context --platform codex", timeout: 5, additionalContextLimit: 2500 };

describe("diagnoseProject", () => {
  it("should_report_non_clean_status_and_deterministic_severity_when_hooks_are_unsafe", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ root, platforms: ["codex"] });
    await writeFile(join(root, ".codex", "hooks.json"), `${JSON.stringify({ hooks: { UserPromptSubmit: [approvedHook, approvedHook, { command: "harnix internal context --platform codex && echo bad" }] } }, null, 2)}\n`);

    const report = await diagnoseProject({ root });

    expect(report.ok).toBe(false);
    expect(report.summary.errors).toBeGreaterThanOrEqual(2);
    expect(report.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["duplicate-hook", "unsafe-hook-command"]));
    expect(report.findings.map((finding) => finding.severity)).toEqual([...report.findings.map((finding) => finding.severity)].sort((left, right) => ({ error: 0, warning: 1, info: 2 })[left] - ({ error: 0, warning: 1, info: 2 })[right]));
  });

  it("should_preserve_user_deleted_files_when_fixing_safe_untracked_files", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml");
    await writeFile(configPath, (await readFile(configPath, "utf8")).replace("languages: []", "languages:\n  - vue"));
    const deleted = join(root, ".harnix", "workflow.md");
    await rm(deleted);

    const report = await diagnoseProject({ root, fix: true });

    expect(report.findings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "managed-missing", path: ".harnix/workflow.md", fixable: false })]));
    await expect(readFile(deleted, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, ".harnix", "spec", "guides", "vue.md"), "utf8")).resolves.toContain("Vue rules");
  });

  it("should_report_broken_injection_when_harnix_markers_are_reversed", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ root, platforms: ["codex"] });
    await writeFile(join(root, "AGENTS.md"), "<!-- harnix:end -->\nUser guidance\n<!-- harnix:begin -->\n");

    const report = await diagnoseProject({ root });

    expect(report.findings).toContainEqual(expect.objectContaining({ code: "broken-injection", fixable: false, path: "AGENTS.md", severity: "warning" }));
  });

  it("should_report_invalid_skill_frontmatter_without_hiding_managed_drift", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ root, platforms: ["codex"] });
    const path = join(root, ".agents", "skills", "harnix-implement", "SKILL.md");
    await writeFile(path, "name: harnix-implement\ndescription: frontmatter markers are missing\n");

    const report = await diagnoseProject({ root });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "managed-modified", path: ".agents/skills/harnix-implement/SKILL.md" }),
      expect.objectContaining({ code: "skill-frontmatter", path: ".agents/skills/harnix-implement/SKILL.md" }),
    ]));
  });

  it("should_redact_detected_secrets_from_doctor_inventory_output", async () => {
    const root = await temporaryRepository();
    const secret = "harnix-super-secret-value";
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "AGENTS.md"), `api_key=${secret}\n`);

    const report = await diagnoseProject({ root });
    const serialized = JSON.stringify(report);

    expect(report.findings).toContainEqual(expect.objectContaining({ code: "secret-exposure", message: expect.stringContaining("[REDACTED]"), path: "AGENTS.md", severity: "error" }));
    expect(serialized).not.toContain(secret);
  });

  it("should_inventory_obsolete_and_untracked_desired_files_together", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", languages: ["vue"], root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml");
    const config = await readConfig(configPath);
    await writeConfig(configPath, { ...config, languages: ["react-web"] });

    const report = await diagnoseProject({ root });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "managed-obsolete", fixable: true, path: ".harnix/spec/guides/vue.md", severity: "warning" }),
      expect.objectContaining({ code: "managed-untracked", fixable: true, path: ".harnix/spec/guides/react-web.md", severity: "warning" }),
    ]));
  });

  it("should_fix_only_safe_untracked_files_when_doctor_runs_with_fix", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config.replace("languages: []", "languages:\n  - vue"));

    const report = await diagnoseProject({ root, fix: true });

    expect(report.summary.fixed).toBeGreaterThan(0);
    expect(report.findings.map((item) => item.code)).not.toContain("managed-untracked");
    await expect(readFile(join(root, ".harnix", "spec", "guides", "vue.md"), "utf8")).resolves.toContain("Vue rules");
  });
});
