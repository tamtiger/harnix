import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { diagnoseProjectSection } from "src/core/doctor/project.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-project-");
const noDesiredFiles = () => [] as string[];

async function initialized() {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

describe("project diagnostics", () => {
  it("reports a directory without Harnix state as not initialized", async () => {
    const result = await diagnoseProjectSection(await temporaryRepository(), noDesiredFiles);

    expect(result.status).toBe("not-initialized");
    expect(result.findings.map((item) => item.code)).toEqual(["project-not-initialized"]);
  });

  it("reports an unreadable config as invalid without leaking the project path", async () => {
    const root = await initialized();
    await writeFile(join(root, ".harnix", "config.yaml"), "schemaVersion: [unterminated\n");

    const result = await diagnoseProjectSection(root, noDesiredFiles);

    expect(result.status).toBe("invalid");
    expect(result.findings[0]).toMatchObject({ code: "config-invalid", severity: "error" });
    expect(result.findings[0]?.message).not.toContain(root);
  });

  it("reports a desired project file that Harnix does not own yet as fixable", async () => {
    const root = await initialized();

    const result = await diagnoseProjectSection(root, () => ["docs/never-created.md"]);

    expect(result.findings).toContainEqual(
      expect.objectContaining({ code: "managed-untracked", path: "docs/never-created.md", fixable: true }),
    );
  });

  it("reports an owned file that is no longer desired as obsolete and fixable when unchanged", async () => {
    const root = await initialized();

    const result = await diagnoseProjectSection(root, noDesiredFiles);

    const obsolete = result.findings.filter((item) => item.code === "managed-obsolete");
    expect(obsolete.length).toBeGreaterThan(0);
    expect(obsolete.every((item) => item.fixable)).toBe(true);
  });

  it("flags a secret-looking value in a sensitive project file", async () => {
    const root = await initialized();
    await mkdir(join(root, ".kiro", "hooks"), { recursive: true });
    await writeFile(join(root, "AGENTS.md"), "api_key = 'abcdefgh12345678'\n");

    const result = await diagnoseProjectSection(root, noDesiredFiles);

    expect(result.status).toBe("invalid");
    expect(result.findings).toContainEqual(
      expect.objectContaining({ code: "secret-exposure", path: "AGENTS.md", severity: "error" }),
    );
  });
});

describe("project diagnostics version skew", () => {
  it("warns, without a fix, when the running CLI is older than the version that wrote the project", async () => {
    const root = await initialized();

    const result = await diagnoseProjectSection(root, noDesiredFiles, "0.0.1");

    expect(result.findings).toContainEqual(
      expect.objectContaining({ code: "cli-version-skew", severity: "warning", fixable: false }),
    );
  });

  it("stays silent when the running CLI is the project's version or no version is supplied", async () => {
    const root = await initialized();
    const { packageVersion } = await import("src/version.js");

    expect(
      (await diagnoseProjectSection(root, noDesiredFiles, packageVersion)).findings.map((f) => f.code),
    ).not.toContain("cli-version-skew");
    expect((await diagnoseProjectSection(root, noDesiredFiles)).findings.map((f) => f.code)).not.toContain(
      "cli-version-skew",
    );
  });
});
