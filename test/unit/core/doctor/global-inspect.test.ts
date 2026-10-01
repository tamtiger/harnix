import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectPlatform, type DoctorTarget } from "src/core/doctor/global-inspect.js";
import { setupGlobal } from "src/core/global/setup.js";
import { globalTargets } from "src/core/global/targets.js";
import { resolveUserPlatformRoots } from "src/core/platform/user-paths.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-inspect-");

const desired = (content: string) => [
  { path: "skills/harnix-plan/SKILL.md", sourceId: "s", kind: "file" as const, content },
];
const plans = (content: string) => ({ desired: () => desired(content), memberMatchers: () => undefined });

async function install(platform: "claude" | "codex", content: string) {
  const home = await temporaryUserHome();
  const homeResolver = () => Promise.resolve(home);
  await setupGlobal({
    platforms: [platform],
    plans: plans(content),
    generatorVersion: "2.0.0",
    commandLookup: () => Promise.resolve(true),
    lockAcquirer: acquireHarnixFileLock,
    homeResolver,
    environment: {},
  });
  const roots = await resolveUserPlatformRoots({ homeResolver, environment: {} });
  return { home, roots };
}

const targetsOf = (
  platform: "claude" | "codex",
  roots: Awaited<ReturnType<typeof install>>["roots"],
  content: string,
) => globalTargets([platform], roots).map((target): DoctorTarget => ({ ...target, desired: desired(content) }));

describe("global integration inspection", () => {
  it("reports not-installed when no target carries a valid sidecar", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: () => Promise.resolve(home), environment: {} });

    const result = await inspectPlatform("claude", targetsOf("claude", roots, "x"), roots, "2.0.0");

    expect(result.state).toBe("not-installed");
    expect(result.findings.map((item) => item.code)).toContain("global-not-installed");
  });

  it("reports an unchanged install as healthy", async () => {
    const { roots } = await install("claude", "v1");

    const result = await inspectPlatform("claude", targetsOf("claude", roots, "v1"), roots, "2.0.0");

    expect(result).toMatchObject({ platform: "claude", state: "healthy", findings: [] });
  });

  it("reports an outdated install as drifted with a fixable finding", async () => {
    const { roots } = await install("claude", "v1");

    const result = await inspectPlatform("claude", targetsOf("claude", roots, "v2"), roots, "2.0.0");

    expect(result.state).toBe("drifted");
    expect(result.findings).toContainEqual(expect.objectContaining({ code: "global-managed-outdated", fixable: true }));
  });

  it("reports a user edit as modified and an obsolete owned file as obsolete", async () => {
    const { home, roots } = await install("claude", "v1");
    await writeFile(join(home, ".claude", "skills", "harnix-plan", "SKILL.md"), "user edit");

    const modified = await inspectPlatform("claude", targetsOf("claude", roots, "v2"), roots, "2.0.0");
    expect(modified.findings.map((item) => item.code)).toContain("global-managed-modified");

    const retired = await inspectPlatform(
      "claude",
      globalTargets(["claude"], roots).map((target): DoctorTarget => ({ ...target, desired: [] })),
      roots,
      "2.0.0",
    );
    expect(retired.findings.map((item) => item.code)).toContain("global-managed-obsolete");
  });

  it("flags a non-empty shadowing file from the registry", async () => {
    const { home, roots } = await install("codex", "v1");
    await mkdir(join(home, ".codex"), { recursive: true });
    await writeFile(join(home, ".codex", "AGENTS.override.md"), "override");

    const result = await inspectPlatform("codex", targetsOf("codex", roots, "v1"), roots, "2.0.0");

    expect(result.findings).toContainEqual(
      expect.objectContaining({ code: "codex-agents-override-shadowed", severity: "warning" }),
    );
  });
});
