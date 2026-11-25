import { access, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { desiredFiles, updateProject } from "src/commands/update.js";
import { uninstallProject } from "src/commands/uninstall.js";
import {
  HARNIX_GITATTRIBUTES_PATH,
  HARNIX_GITIGNORE_PATH,
  gitattributesTemplate,
  gitignoreTemplate,
} from "src/templates/harnix/git-files.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const fixture = useTemporaryRepositories("harnix-git-hygiene-");

async function initialized(): Promise<string> {
  const root = await fixture();
  await writeFile(join(root, "package.json"), '{"dependencies":{"vue":"1"}}');
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

describe("the Harnix-owned git files", () => {
  it("ignore only regenerable and per-person data and force LF for the project data", () => {
    const lines = gitignoreTemplate.split("\n");
    expect(lines).toEqual(expect.arrayContaining(["/cache/", "/tmp/", "tasks/.active"]));
    // Anchored on purpose: a bare `cache/` would also hide a `cache` folder of a project skill or of the journal.
    expect(lines).not.toContain("cache/");
    expect(lines).not.toContain("tmp/");
    expect(lines).not.toContain("workspace/");
    expect(lines).not.toContain("tasks/");
    expect(gitignoreTemplate.startsWith("# Managed by Harnix")).toBe(true);
    expect(gitattributesTemplate.startsWith("# Managed by Harnix")).toBe(true);
    expect(gitattributesTemplate.split("\n")).toContain("* text eol=lf");
    expect(gitignoreTemplate.endsWith("\n")).toBe(true);
    expect(gitattributesTemplate.endsWith("\n")).toBe(true);
  });

  it("are declared as project-scope managed files next to the other project files", () => {
    const desired = desiredFiles({ languages: [], technologies: [], packages: [] });
    const paths = desired.map((file) => file.entry.path);
    expect(paths).toContain(HARNIX_GITIGNORE_PATH);
    expect(paths).toContain(HARNIX_GITATTRIBUTES_PATH);
    expect(HARNIX_GITIGNORE_PATH).toBe(".harnix/.gitignore");
    expect(HARNIX_GITATTRIBUTES_PATH).toBe(".harnix/.gitattributes");
    for (const file of desired.filter((item) => item.entry.path.startsWith(".harnix/."))) {
      expect(file.entry.scope).toBe("project");
    }
  });
});

describe("harnix init and update", () => {
  it("write both files inside .harnix and never touch the root .gitignore or .gitattributes", async () => {
    const root = await fixture();
    await writeFile(join(root, "package.json"), '{"dependencies":{"vue":"1"}}');
    await writeFile(join(root, ".gitignore"), "node_modules/\n");
    await writeFile(join(root, ".gitattributes"), "* text=auto\n");

    const result = await initializeProject({ developer: "tam", root, yes: true });

    expect(await readFile(join(root, HARNIX_GITIGNORE_PATH), "utf8")).toBe(gitignoreTemplate);
    expect(await readFile(join(root, HARNIX_GITATTRIBUTES_PATH), "utf8")).toBe(gitattributesTemplate);
    expect(await readFile(join(root, ".gitignore"), "utf8")).toBe("node_modules/\n");
    expect(await readFile(join(root, ".gitattributes"), "utf8")).toBe("* text=auto\n");
    expect(result.created).toEqual(expect.arrayContaining([HARNIX_GITIGNORE_PATH, HARNIX_GITATTRIBUTES_PATH]));
    const manifest = JSON.parse(await readFile(join(root, ".harnix", ".template-hashes.json"), "utf8")) as {
      entries: Array<{ path: string; scope: string }>;
    };
    expect(manifest.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: HARNIX_GITIGNORE_PATH, scope: "project" }),
        expect.objectContaining({ path: HARNIX_GITATTRIBUTES_PATH, scope: "project" }),
      ]),
    );
  });

  it("a second update changes nothing and keeps both files as preserved", async () => {
    const root = await initialized();
    const before = await readFile(join(root, HARNIX_GITIGNORE_PATH), "utf8");

    const again = await updateProject({ root });

    expect(again.created).not.toContain(HARNIX_GITIGNORE_PATH);
    expect(again.updated).not.toContain(HARNIX_GITIGNORE_PATH);
    expect(again.preserved).toEqual(expect.arrayContaining([HARNIX_GITIGNORE_PATH, HARNIX_GITATTRIBUTES_PATH]));
    expect(await readFile(join(root, HARNIX_GITIGNORE_PATH), "utf8")).toBe(before);
  });

  it("keep a user-edited .harnix/.gitignore and report it as preserved", async () => {
    const root = await initialized();
    await writeFile(join(root, HARNIX_GITIGNORE_PATH), "cache/\ntmp/\ntasks/.active\nworkspace/\n");

    const again = await updateProject({ root });

    expect(again.preserved).toContain(HARNIX_GITIGNORE_PATH);
    expect(again.updated).not.toContain(HARNIX_GITIGNORE_PATH);
    expect(await readFile(join(root, HARNIX_GITIGNORE_PATH), "utf8")).toContain("workspace/");
  });

  it("keep a .harnix/.gitattributes the user wrote before Harnix managed it", async () => {
    const root = await fixture();
    await writeFile(join(root, "package.json"), '{"dependencies":{"vue":"1"}}');
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, HARNIX_GITATTRIBUTES_PATH), "*.json text eol=crlf\n");

    const again = await updateProject({ root });

    expect(again.preserved).toContain(HARNIX_GITATTRIBUTES_PATH);
    expect(await readFile(join(root, HARNIX_GITATTRIBUTES_PATH), "utf8")).toBe("*.json text eol=crlf\n");
  });

  it("do not recreate a deleted file unless --restore-deleted is requested", async () => {
    const root = await initialized();
    await rm(join(root, HARNIX_GITATTRIBUTES_PATH));

    const plain = await updateProject({ root });
    expect(plain.deleted).toContain(HARNIX_GITATTRIBUTES_PATH);
    await expect(access(join(root, HARNIX_GITATTRIBUTES_PATH))).rejects.toMatchObject({ code: "ENOENT" });

    const restored = await updateProject({ root, restoreDeleted: true });
    expect(restored.created.concat(restored.updated)).toContain(HARNIX_GITATTRIBUTES_PATH);
  });
});

describe("harnix uninstall --purge", () => {
  it("removes the git files together with the rest of .harnix", async () => {
    const root = await initialized();

    await uninstallProject({ root, purge: true, yes: true });

    await expect(access(join(root, HARNIX_GITIGNORE_PATH))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, HARNIX_GITATTRIBUTES_PATH))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
