import { access, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseProject } from "src/commands/doctor.js";
import { initializeProject } from "src/commands/init.js";
import { setupPlatforms } from "src/commands/setup.js";
import { GlobalManagedTransactionError } from "src/core/global/managed-files.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";
import { globalDoctorOptions as globalOptions } from "test/support/integration-fixtures.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-");
const temporaryUserHome = useTemporaryUserHomes("harnix-doctor-home-");

describe("diagnoseProject Doctor v2 global integrations", () => {
  it("should_report_project_not_initialized_but_still_inspect_global_integrations", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report).toMatchObject({
      generator: "harnix",
      schemaVersion: 2,
      ok: true,
      project: { status: "not-initialized" },
    });
    expect(
      report.globalIntegrations.map((integration) => ({ platform: integration.platform, status: integration.status })),
    ).toEqual([
      { platform: "kiro", status: "not-installed" },
      { platform: "antigravity", status: "not-installed" },
      { platform: "codex", status: "not-installed" },
      { platform: "claude", status: "not-installed" },
    ]);
  });

  it("should_report_global_codex_as_pending_trust_without_exposing_the_user_home", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["codex"] });

    const report = await diagnoseProject({ root, ...globalOptions(home) });
    const codex = report.globalIntegrations.find((integration) => integration.platform === "codex");

    expect(report.project.status).toBe("ready");
    expect(report.ok).toBe(false);
    expect(codex).toMatchObject({ status: "installed-pending-trust" });
    expect(codex?.findings).toContainEqual(
      expect.objectContaining({ code: "codex-trust-pending", severity: "warning" }),
    );
    expect(JSON.stringify(report)).not.toContain(home);
  });

  it("should_surface_only_explicit_global_capability_evidence_in_the_v2_report", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro", "antigravity", "codex"] });

    const report = await diagnoseProject({
      ...globalOptions(home),
      capabilityLookup: async (platform) =>
        ({
          kiro: "unsupported-version" as const,
          antigravity: "shadowed" as const,
          codex: "active" as const,
          claude: "active" as const,
        })[platform],
      codexTrustLookup: async () => "trusted",
      root,
    });

    expect(
      report.globalIntegrations.map((integration) => ({ platform: integration.platform, status: integration.status })),
    ).toEqual([
      { platform: "kiro", status: "unsupported-version" },
      { platform: "antigravity", status: "shadowed" },
      { platform: "codex", status: "active" },
      { platform: "claude", status: "not-installed" },
    ]);
  });

  it("should_not_mutate_global_integrations_when_project_only_fix_is_requested", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro"] });
    const globalManifest = join(home, ".kiro", "harnix", "managed.json");
    const before = await readFile(globalManifest, "utf8");
    await rm(join(root, ".harnix", "workflow.md"));

    const report = await diagnoseProject({ root, fix: true, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(
      expect.objectContaining({ code: "managed-missing", path: ".harnix/workflow.md" }),
    );
    await expect(readFile(globalManifest, "utf8")).resolves.toBe(before);
    await expect(access(join(root, ".harnix", "workflow.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_repair_only_safe_missing_global_entries_when_fix_global_is_explicit", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro"] });
    const steering = join(home, ".kiro", "steering", "harnix.md");
    const repoMap = join(root, ".harnix", "cache", "repo-map-v1.json");
    await rm(steering);
    await rm(repoMap);

    const report = await diagnoseProject({ root, fix: true, global: true, ...globalOptions(home) });

    expect(report.summary.fixed).toBeGreaterThan(0);
    await expect(readFile(steering, "utf8")).resolves.toContain("Harnix rules");
    await expect(access(repoMap)).rejects.toMatchObject({ code: "ENOENT" });
    expect(report.project.findings).toContainEqual(
      expect.objectContaining({ code: "repo-map-missing", fixable: true }),
    );
  });

  it("should_report_preserved_concurrent_global_edits_when_global_fix_rolls_back_partially", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro"] });
    const partialPath = "~/.kiro/steering/harnix.md";

    const report = await diagnoseProject({
      root,
      fix: true,
      global: true,
      ...globalOptions(home),
      globalUpdate: async () => {
        throw new GlobalManagedTransactionError(
          "Global managed reconciliation failed; attempted writes were rolled back conservatively.",
          { partial: [partialPath], restored: [] },
          new Error("concurrent editor"),
        );
      },
    });

    const kiro = report.globalIntegrations.find((integration) => integration.platform === "kiro");
    expect(kiro).toMatchObject({ status: "drifted" });
    expect(kiro?.findings).toContainEqual(
      expect.objectContaining({
        code: "global-partial-rollback",
        path: partialPath,
        severity: "warning",
        fixable: false,
      }),
    );
    expect(JSON.stringify(report)).not.toContain(home);
  });
});
