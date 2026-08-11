import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseGlobalIntegrations } from "../../src/commands/global-doctor.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { resolveUserPlatformRoots } from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-doctor-");

function environment(home: string): Record<string, string> {
  return { CODEX_HOME: join(home, "codex-home") };
}

async function install(home: string, platforms: readonly ("kiro" | "antigravity" | "codex")[]): Promise<void> {
  await setupPlatforms({
    commandLookup: async () => true,
    environment: environment(home),
    homeResolver: async () => home,
    platforms,
  });
}

describe("diagnoseGlobalIntegrations", () => {
  it("fails closed in test mode without injected user roots or a home resolver", async () => {
    const [kiro] = await diagnoseGlobalIntegrations({
      commandLookup: async () => true,
      platforms: ["kiro"],
    });

    expect(kiro).toMatchObject({ platform: "kiro", status: "invalid" });
    expect(kiro?.findings).toContainEqual(expect.objectContaining({ code: "test-home-required", severity: "error" }));
  });

  it("fails closed in test mode without an injected command lookup", async () => {
    const home = await temporaryUserHome();
    const [kiro] = await diagnoseGlobalIntegrations({
      environment: environment(home),
      homeResolver: async () => home,
      platforms: ["kiro"],
    });

    expect(kiro).toMatchObject({ platform: "kiro", status: "invalid" });
    expect(kiro?.findings).toContainEqual(expect.objectContaining({ code: "test-command-lookup-required", severity: "error" }));
    await expect(access(join(home, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reports all public integrations as not installed from injected UserPathRoots without creating files", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ environment: environment(home), homeResolver: async () => home });
    let commandLookups = 0;

    const integrations = await diagnoseGlobalIntegrations({
      commandLookup: async () => {
        commandLookups += 1;
        return true;
      },
      roots,
    });

    expect(integrations.map(({ platform, status }) => ({ platform, status }))).toEqual([
      { platform: "kiro", status: "not-installed" },
      { platform: "antigravity", status: "not-installed" },
      { platform: "codex", status: "not-installed" },
    ]);
    expect(integrations.flatMap((integration) => integration.findings).every((finding) => !(finding.path ?? "").includes(home))).toBe(true);
    expect(commandLookups).toBe(0);
    await expect(access(join(home, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".gemini"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, "codex-home"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_report_an_unowned_harnix_skill_unit_when_no_global_sidecar_exists", async () => {
    const home = await temporaryUserHome();
    const userOwnedSkill = join(home, ".kiro", "skills", "harnix-check", "USER-NOTES.md");
    await mkdir(join(userOwnedSkill, ".."), { recursive: true });
    await writeFile(userOwnedSkill, "user-owned skill data\n", "utf8");

    const [kiro] = await diagnoseGlobalIntegrations({
      commandLookup: async () => true,
      environment: environment(home),
      homeResolver: async () => home,
      platforms: ["kiro"],
    });

    expect(kiro).toMatchObject({ platform: "kiro", status: "not-installed" });
    expect(kiro?.findings).toContainEqual(expect.objectContaining({
      code: "global-untracked-surface",
      fixable: false,
      path: "~/.kiro/skills/harnix-check/SKILL.md",
      severity: "warning",
    }));
    await expect(readFile(userOwnedSkill, "utf8")).resolves.toBe("user-owned skill data\n");
  });

  it("reports healthy integrations without writing and never claims an untrusted Codex hook is active", async () => {
    const home = await temporaryUserHome();
    await install(home, ["kiro", "antigravity", "codex"]);
    const paths = [
      join(home, ".kiro", "harnix", "managed.json"),
      join(home, ".gemini", "config", "plugins", "harnix", ".managed.json"),
      join(home, ".gemini", "antigravity-cli", "plugins", "harnix", ".managed.json"),
      join(home, ".agents", "harnix", "managed.json"),
      join(home, "codex-home", "harnix", "managed.json"),
    ];
    const before = await Promise.all(paths.map(async (path) => readFile(path, "utf8")));

    const integrations = await diagnoseGlobalIntegrations({
      capabilityLookup: async (platform) => platform === "codex" ? "active" : "supported",
      commandLookup: async () => true,
      environment: environment(home),
      homeResolver: async () => home,
    });

    expect(integrations.map(({ platform, status }) => ({ platform, status }))).toEqual([
      { platform: "kiro", status: "installed" },
      { platform: "antigravity", status: "precedence-unknown" },
      { platform: "codex", status: "installed-pending-trust" },
    ]);
    const codex = integrations.find((integration) => integration.platform === "codex");
    expect(codex?.findings).toContainEqual(expect.objectContaining({ code: "codex-trust-pending", severity: "warning" }));
    expect(JSON.stringify(codex)).not.toContain('"active"');
    expect(integrations.find((integration) => integration.platform === "antigravity")?.findings).toContainEqual(expect.objectContaining({ code: "antigravity-precedence-unknown" }));
    expect(JSON.stringify(integrations)).not.toContain(home);
    await expect(Promise.all(paths.map(async (path) => readFile(path, "utf8")))).resolves.toEqual(before);
  });

  it("reports_active_shadowed_and_unsupported_version_only_from_explicit_capability_evidence", async () => {
    const home = await temporaryUserHome();
    await install(home, ["kiro", "antigravity", "codex"]);

    const integrations = await diagnoseGlobalIntegrations({
      capabilityLookup: async (platform) => ({
        kiro: "unsupported-version" as const,
        antigravity: "shadowed" as const,
        codex: "active" as const,
      })[platform],
      codexTrustLookup: async () => "trusted",
      commandLookup: async () => true,
      environment: environment(home),
      homeResolver: async () => home,
    });

    expect(integrations.map(({ platform, status }) => ({ platform, status }))).toEqual([
      { platform: "kiro", status: "unsupported-version" },
      { platform: "antigravity", status: "shadowed" },
      { platform: "codex", status: "active" },
    ]);
    expect(integrations[0]?.findings).toContainEqual(expect.objectContaining({ code: "global-unsupported-version", severity: "warning" }));
    expect(integrations[1]?.findings).toContainEqual(expect.objectContaining({ code: "global-integration-shadowed", severity: "warning" }));
    expect(integrations[2]?.findings).toContainEqual(expect.objectContaining({ code: "global-integration-active", severity: "info" }));
  });

  it("reports a missing launcher separately from correctly owned global files", async () => {
    const home = await temporaryUserHome();
    await install(home, ["kiro"]);

    const [kiro] = await diagnoseGlobalIntegrations({
      commandLookup: async () => false,
      environment: environment(home),
      homeResolver: async () => home,
      platforms: ["kiro"],
    });

    expect(kiro).toMatchObject({ platform: "kiro", status: "binary-unavailable" });
    expect(kiro?.findings).toContainEqual(expect.objectContaining({ code: "global-binary-unavailable", severity: "warning" }));
  });

  it("reports_a_nonempty_codex_agents_override_as_shadowing_without_mutating_it", async () => {
    const home = await temporaryUserHome();
    await install(home, ["codex"]);
    const override = join(home, "codex-home", "AGENTS.override.md");
    await writeFile(override, "# User override\n\nTake precedence.\n", { encoding: "utf8" });

    const [codex] = await diagnoseGlobalIntegrations({
      commandLookup: async () => true,
      environment: environment(home),
      homeResolver: async () => home,
      platforms: ["codex"],
    });

    expect(codex).toMatchObject({ platform: "codex", status: "shadowed" });
    expect(codex?.findings).toContainEqual(expect.objectContaining({ code: "codex-agents-override-shadowed", path: "$CODEX_HOME/AGENTS.override.md", severity: "warning", fixable: false }));
    await expect(readFile(override, "utf8")).resolves.toBe("# User override\n\nTake precedence.\n");
  });

  it("warns_when_kiro_home_is_ambiguous_without_retargeting_the_global_installation", async () => {
    const home = await temporaryUserHome();
    await install(home, ["kiro"]);
    const configuredHome = join(home, "other-kiro-home");

    const [kiro] = await diagnoseGlobalIntegrations({
      commandLookup: async () => true,
      environment: { ...environment(home), KIRO_HOME: configuredHome },
      homeResolver: async () => home,
      platforms: ["kiro"],
    });

    expect(kiro).toMatchObject({ platform: "kiro", status: "installed" });
    expect(kiro?.findings).toContainEqual(expect.objectContaining({ code: "kiro-home-ambiguity", severity: "warning", fixable: false }));
    expect(JSON.stringify(kiro)).not.toContain(configuredHome);
    await expect(access(configuredHome)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reports owned global drift without reconciling or overwriting the modified file", async () => {
    const home = await temporaryUserHome();
    await install(home, ["kiro"]);
    const skill = join(home, ".kiro", "skills", "harnix-check", "SKILL.md");
    await writeFile(skill, "user modification\n");

    const [kiro] = await diagnoseGlobalIntegrations({
      commandLookup: async () => true,
      environment: environment(home),
      homeResolver: async () => home,
      platforms: ["kiro"],
    });

    expect(kiro).toMatchObject({ platform: "kiro", status: "drifted" });
    expect(kiro?.findings).toContainEqual(expect.objectContaining({ code: "global-managed-modified", path: "~/.kiro/skills/harnix-check/SKILL.md", fixable: false }));
    await expect(readFile(skill, "utf8")).resolves.toBe("user modification\n");
  });

  it("fails closed as invalid when an owned global sidecar is corrupt", async () => {
    const home = await temporaryUserHome();
    await install(home, ["codex"]);
    const manifest = join(home, "codex-home", "harnix", "managed.json");
    await writeFile(manifest, "not-json\n");

    const [codex] = await diagnoseGlobalIntegrations({
      commandLookup: async () => true,
      environment: environment(home),
      homeResolver: async () => home,
      platforms: ["codex"],
    });

    expect(codex).toMatchObject({ platform: "codex", status: "invalid" });
    expect(codex?.findings).toContainEqual(expect.objectContaining({ code: "global-manifest-invalid", severity: "error", path: "$CODEX_HOME/harnix/managed.json" }));
    await expect(readFile(manifest, "utf8")).resolves.toBe("not-json\n");
  });
});
