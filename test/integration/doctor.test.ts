import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseProject } from "../../src/commands/doctor.js";
import { initializeProject } from "../../src/commands/init.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

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
});
