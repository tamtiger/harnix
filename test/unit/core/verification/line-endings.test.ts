import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { computeInputDigest, digestMatches } from "src/core/verification/input-digest.js";
import { isLineEndingSensitive, isTextContent, normalizeLineEndings } from "src/core/verification/line-endings.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const bytes = (text: string): Uint8Array => Buffer.from(text, "latin1");
const text = (content: Uint8Array): string => Buffer.from(content).toString("latin1");

describe("line endings", () => {
  it("turns CRLF into LF in text content and keeps LF as it is", () => {
    expect(text(normalizeLineEndings(bytes("a\r\nb\r\n")))).toBe("a\nb\n");
    expect(text(normalizeLineEndings(bytes("a\nb\n")))).toBe("a\nb\n");
    expect(text(normalizeLineEndings(bytes("")))).toBe("");
  });

  it("keeps a lone CR and handles a trailing CR", () => {
    expect(text(normalizeLineEndings(bytes("a\rb\r\n")))).toBe("a\rb\n");
    expect(text(normalizeLineEndings(bytes("a\r")))).toBe("a\r");
  });

  it("leaves content with a NUL byte untouched", () => {
    const binary = bytes("a\r\n\u0000b\r\n");

    expect(isTextContent(binary)).toBe(false);
    expect(text(normalizeLineEndings(binary))).toBe("a\r\n\u0000b\r\n");
  });

  it("keeps bytes above 0x7f unchanged", () => {
    const utf8 = Buffer.from("Tiếng Việt\r\n", "utf8");

    expect(Buffer.from(normalizeLineEndings(utf8)).toString("utf8")).toBe("Tiếng Việt\n");
  });
});

const temporaryRepository = useTemporaryRepositories("harnix-digest-eol-");
const timestamp = "2026-09-29T09:00:00.000+07:00";

function taskFixture(): TaskRecordV3 {
  return buildTaskV3({
    id: "20260929-090000-digest-eol",
    title: "Digest EOL",
    mode: "full",
    status: "in_progress",
    checkpoint: "implementing",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

async function repositoryWith(path: string, content: string | Buffer): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, path), content);
  return root;
}

describe("input digest and line endings", () => {
  it("gives the same digest to LF and CRLF text but keeps the raw byte digest different", async () => {
    const root = await repositoryWith("src/a.ts", "export const a = 1;\nexport const b = 2;\n");
    const lf = await computeInputDigest(root, taskFixture(), "check");
    await writeFile(join(root, "src", "a.ts"), "export const a = 1;\r\nexport const b = 2;\r\n");

    const crlf = await computeInputDigest(root, taskFixture(), "check");

    expect(crlf.inputDigest).toBe(lf.inputDigest);
    expect(crlf.entries).toEqual(lf.entries);
    expect(crlf.rawInputDigest).not.toBe(lf.rawInputDigest);
    expect(lf.rawInputDigest).toBe(lf.inputDigest);
  });

  it("still tells different text apart and keeps binary files byte exact", async () => {
    const root = await repositoryWith("src/a.ts", "export const a = 1;\n");
    const before = await computeInputDigest(root, taskFixture(), "check");
    await writeFile(join(root, "src", "a.ts"), "export const a = 2;\r\n");
    expect((await computeInputDigest(root, taskFixture(), "check")).inputDigest).not.toBe(before.inputDigest);

    const binary = await repositoryWith("src/a.ts", Buffer.from("a\r\n\u0000b\r\n", "latin1"));
    const binaryBefore = await computeInputDigest(binary, taskFixture(), "check");
    await writeFile(join(binary, "src", "a.ts"), Buffer.from("a\n\u0000b\n", "latin1"));

    expect((await computeInputDigest(binary, taskFixture(), "check")).inputDigest).not.toBe(binaryBefore.inputDigest);
  });

  it("accepts evidence recorded from the raw bytes while the content is unchanged", async () => {
    const root = await repositoryWith("src/a.ts", "export const a = 1;\r\n");
    const snapshot = await computeInputDigest(root, taskFixture(), "check");

    expect(digestMatches(snapshot, snapshot.rawInputDigest)).toBe(true);
    expect(digestMatches(snapshot, snapshot.legacyInputDigest)).toBe(true);
    expect(digestMatches(snapshot, snapshot.inputDigest)).toBe(true);
    expect(digestMatches(snapshot, "0".repeat(64))).toBe(false);
    expect(digestMatches(snapshot, undefined)).toBe(false);
  });

  it("keeps evidence fresh when a file moves between LF and CRLF after it was recorded", async () => {
    const root = await repositoryWith("src/a.ts", "export const a = 1;\r\n");
    const recorded = (await computeInputDigest(root, taskFixture(), "check")).inputDigest;
    await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");

    expect(digestMatches(await computeInputDigest(root, taskFixture(), "check"), recorded)).toBe(true);
  });

  it("does not accept a raw digest recorded before the content changed", async () => {
    const root = await repositoryWith("src/a.ts", "export const a = 1;\r\n");
    const oldRaw = (await computeInputDigest(root, taskFixture(), "check")).rawInputDigest;
    await writeFile(join(root, "src", "a.ts"), "export const a = 9;\r\n");

    expect(digestMatches(await computeInputDigest(root, taskFixture(), "check"), oldRaw)).toBe(false);
  });

  it("keeps the sources git should treat as text free of NUL bytes and lone CR", async () => {
    for (const path of [
      "src/core/verification/input-digest.ts",
      "src/core/workflow/init-task.ts",
      "test/unit/core/tasks/task-validate-contracts.test.ts",
    ]) {
      const repositoryFile = fileURLToPath(new URL(`../../../../${path}`, import.meta.url));
      const content = (await readFile(repositoryFile)).toString("latin1");
      expect(content.includes("\u0000"), `${path} has a NUL byte`).toBe(false);
      expect(/\r(?!\n)/u.test(content), `${path} has a lone CR`).toBe(false);
    }
  });
});

describe("line endings that change what a file does", () => {
  it("recognises scripts, batch files, Makefiles and Dockerfiles by name", () => {
    for (const path of [
      "run.sh",
      "tools/setup.BASH",
      "a/b/Makefile",
      "GNUmakefile",
      "docker/Dockerfile",
      "x.cmd",
      "y.bat",
      "tools/Do.PS1",
      "m.psm1",
      "a.vbs",
      "b.reg",
      "__snapshots__/c.snap",
      "rules.mk",
    ])
      expect(isLineEndingSensitive(path), path).toBe(true);
    for (const path of ["src/a.ts", "README.md", "notes.txt", "Makefile.md", "shell/readme"])
      expect(isLineEndingSensitive(path), path).toBe(false);
  });

  it("keeps the digest of a shell script tied to its exact bytes", async () => {
    const root = await repositoryWith("src/run.sh", "#!/bin/sh\necho ok\n");
    const lf = await computeInputDigest(root, taskFixture(), "check");
    await writeFile(join(root, "src", "run.sh"), "#!/bin/sh\r\necho ok\r\n");

    const crlf = await computeInputDigest(root, taskFixture(), "check");

    expect(crlf.inputDigest).not.toBe(lf.inputDigest);
  });
});
