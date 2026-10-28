import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectPlatform, type DoctorTarget } from "src/core/doctor/global-inspect.js";
import type { DesiredGlobalManagedFile } from "src/core/global/managed-files.js";
import { setupGlobal } from "src/core/global/setup.js";
import { globalTargets } from "src/core/global/targets.js";
import { resolveUserPlatformRoots } from "src/core/platform/user-paths.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-finding-global-");

const skill = (content: string): DesiredGlobalManagedFile => ({
  path: "skills/harnix-plan/SKILL.md",
  sourceId: "s",
  kind: "file",
  content,
});
const block = (begin: string, end: string, content = "body"): DesiredGlobalManagedFile => ({
  path: "CLAUDE.md",
  sourceId: "guard",
  kind: "managed-block",
  selector: { type: "markers", begin, end },
  content,
});
const BEGIN = "<!-- harnix:begin -->";
const END = "<!-- harnix:end -->";

async function install(desired: readonly DesiredGlobalManagedFile[]) {
  const home = await temporaryUserHome();
  const homeResolver = () => Promise.resolve(home);
  await setupGlobal({
    platforms: ["claude"],
    plans: { desired: () => [...desired], memberMatchers: () => undefined },
    generatorVersion: "2.0.0",
    commandLookup: () => Promise.resolve(true),
    lockAcquirer: acquireHarnixFileLock,
    homeResolver,
    environment: {},
  });
  const roots = await resolveUserPlatformRoots({ homeResolver, environment: {} });
  return { home, roots };
}

type Roots = Awaited<ReturnType<typeof install>>["roots"];

async function codesFor(roots: Roots, desired: readonly DesiredGlobalManagedFile[]): Promise<string[]> {
  const targets = globalTargets(["claude"], roots).map((target): DoctorTarget => ({ ...target, desired }));
  const result = await inspectPlatform("claude", targets, roots, "2.0.0");
  return result.findings.map((item) => item.code);
}

describe("global doctor finding fixtures", () => {
  it("global-managed-missing: an owned file deleted by the user is not restored", async () => {
    const desired = [skill("v1")];
    const { home, roots } = await install(desired);
    await rm(join(home, ".claude", "skills", "harnix-plan", "SKILL.md"));

    expect(await codesFor(roots, desired)).toContain("global-managed-missing");
  });

  it("global-managed-deleted: an unmodified owned file that is no longer desired would be removed", async () => {
    const { roots } = await install([skill("v1")]);

    expect(await codesFor(roots, [])).toContain("global-managed-deleted");
  });

  it("global-fragment-malformed: unbalanced Harnix markers in a shared file", async () => {
    const desired = [block(BEGIN, END)];
    const { home, roots } = await install(desired);
    const file = join(home, ".claude", "CLAUDE.md");
    await writeFile(file, (await readFile(file, "utf8")).replace(END, ""));

    expect(await codesFor(roots, desired)).toContain("global-fragment-malformed");
  });

  it("global-managed-conflict: the desired fragment selector no longer matches the owned one", async () => {
    const { roots } = await install([block(BEGIN, END)]);

    expect(await codesFor(roots, [block("<!-- other:begin -->", "<!-- other:end -->")])).toContain(
      "global-managed-conflict",
    );
  });

  it("global-manifest-platform-mismatch: the sidecar names another platform", async () => {
    const desired = [skill("v1")];
    const { roots } = await install(desired);
    const [target] = globalTargets(["claude"], roots);
    const manifestFile = join(target!.root.path, target!.manifestPath);
    const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as Record<string, unknown>;
    await writeFile(manifestFile, JSON.stringify({ ...manifest, platform: "codex" }));

    expect(await codesFor(roots, desired)).toContain("global-manifest-platform-mismatch");
  });

  it("global-reconciliation-invalid: a desired path that escapes the root cannot be reconciled", async () => {
    const { roots } = await install([skill("v1")]);
    const escaping: DesiredGlobalManagedFile = { path: "../escape.md", sourceId: "x", kind: "file", content: "x" };

    expect(await codesFor(roots, [escaping])).toContain("global-reconciliation-invalid");
  });
});
