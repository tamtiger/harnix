import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { scanTaskSecrets } from "src/core/workflow/secret-scan.js";
import { buildCheck, buildTaskV3, createTestProject } from "test/support/builders.js";
import { completeTaskWithDecisions } from "test/support/learning-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

// Built from parts so this file never contains a literal that looks like a real secret.
const AWS_KEY = `AKIA${"ABCDEFGHIJKLMNOP"}`;
const GITHUB_TOKEN = `gh${"p_"}${"a".repeat(36)}`;
const JWT = `eyJ${"a".repeat(12)}.${"b".repeat(12)}.${"c".repeat(12)}`;
const PRIVATE_KEY = `-----BEGIN ${"RSA PRIVATE KEY"}-----\nMIIB\n`;
const PASSWORD = "Hunter2xyz";

function task(overrides: { relevantPaths?: string[]; inputs?: string[] } = {}) {
  return buildTaskV3({
    relevantPaths: overrides.relevantPaths ?? [],
    validationPlan: [buildCheck({ inputs: overrides.inputs ?? ["src/**"] })],
  });
}

async function project(files: Record<string, string>): Promise<string> {
  const root = await temporaryRepository();
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}

describe("scanTaskSecrets", () => {
  it.each([
    ["private-key", PRIVATE_KEY],
    ["vendor-token", `aws = ${AWS_KEY}`],
    ["vendor-token", `token ${GITHUB_TOKEN}`],
    ["jwt", `Authorization: ${JWT}`],
    ["connection-string-password", `Server=db;User Id=sa;Password=${PASSWORD};Encrypt=true`],
    ["connection-string-password", `postgres://user:${PASSWORD}@host/db`],
    ["credential-assignment", `{ "Password": "${PASSWORD}" }`],
    ["credential-assignment", `const api_key = '${PASSWORD}';`],
  ])("reports the %s rule without ever returning the value", async (rule, content) => {
    const root = await project({ "src/app.json": content });

    const advisory = await scanTaskSecrets(root, task());

    expect(advisory).toEqual({ files: 1, findings: [{ path: "src/app.json", rule }] });
    for (const secret of [PASSWORD, AWS_KEY, GITHUB_TOKEN, JWT]) expect(JSON.stringify(advisory)).not.toContain(secret);
  });

  it.each([
    '{ "Password": "<your-password>" }',
    '{ "Password": "${DB_PASSWORD}" }',
    '{ "Password": "{{secret}}" }',
    '{ "Password": "changeme" }',
    '{ "ApiKey": "your-api-key-here" }',
    "const token = getToken();",
    "Server=db;Integrated Security=true",
  ])("ignores a placeholder or a clean line: %s", async (content) => {
    const root = await project({ "src/app.json": content });

    await expect(scanTaskSecrets(root, task())).resolves.toBeUndefined();
  });

  it("scans the relevant paths and the check inputs, and nothing else", async () => {
    const root = await project({
      "config/ci.json": `{ "Password": "${PASSWORD}" }`,
      "src/in-input.json": `{ "Password": "${PASSWORD}" }`,
      "other/unrelated.json": `{ "Password": "${PASSWORD}" }`,
    });

    const advisory = await scanTaskSecrets(root, task({ relevantPaths: ["config/ci.json"] }));

    expect(advisory?.findings.map(({ path }) => path)).toEqual(["config/ci.json", "src/in-input.json"]);
    expect(advisory?.files).toBe(2);
  });

  it("caps the files read at 200 and lists at most 5 findings in path order", async () => {
    const files: Record<string, string> = {};
    for (let index = 0; index < 205; index += 1)
      files[`src/f${String(index).padStart(3, "0")}.json`] = `{ "Password": "${PASSWORD}" }`;
    const root = await project(files);

    const advisory = await scanTaskSecrets(root, task());

    expect(advisory?.files).toBe(200);
    expect(advisory?.findings.map(({ path }) => path)).toEqual(
      ["000", "001", "002", "003", "004"].map((n) => `src/f${n}.json`),
    );
  });

  it("skips a file over 128 KiB and a binary file", async () => {
    const root = await project({
      "src/big.json": `{ "Password": "${PASSWORD}" }${" ".repeat(129 * 1024)}`,
      "src/binary.bin": `\u0000${PRIVATE_KEY}`,
    });

    await expect(scanTaskSecrets(root, task())).resolves.toBeUndefined();
  });

  it("does not follow a symlink out of the project", async () => {
    const root = await project({ "src/ok.txt": "clean" });
    const outside = await project({ "secret.json": `{ "Password": "${PASSWORD}" }` });
    try {
      await symlink(join(outside, "secret.json"), join(root, "src", "link.json"));
    } catch {
      return; // creating a symlink needs a privilege some Windows accounts lack
    }

    await expect(scanTaskSecrets(root, task())).resolves.toBeUndefined();
  });

  it("returns nothing for a clean project and for a project that cannot be read", async () => {
    const clean = await project({ "src/a.ts": "export const a = 1;\n" });

    await expect(scanTaskSecrets(clean, task())).resolves.toBeUndefined();
    await expect(scanTaskSecrets(join(clean, "missing"), task())).resolves.toBeUndefined();
  });
});

describe("finish report", () => {
  async function finishWith(files: Record<string, string>) {
    const root = await createTestProject(await temporaryRepository());
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(root, path, ".."), { recursive: true });
      await writeFile(join(root, path), content);
    }
    return completeTaskWithDecisions(root, {
      id: "20260929-090000-secret-a",
      minute: 0,
      relevantPaths: ["config/ci.json"],
    });
  }

  it("carries the advisory when a file of the task holds a secret, without a value", async () => {
    const report = await finishWith({ "config/ci.json": `{ "Password": "${PASSWORD}" }`, "src/a.ts": "export {};\n" });

    expect(report.task.status).toBe("completed");
    expect(report.secretAdvisory).toEqual({
      files: 1,
      findings: [{ path: "config/ci.json", rule: "credential-assignment" }],
    });
    expect(JSON.stringify(report)).not.toContain(PASSWORD);
  });

  it("has no advisory for clean files", async () => {
    const report = await finishWith({ "config/ci.json": '{ "Mode": "ci" }', "src/a.ts": "export {};\n" });

    expect(report.secretAdvisory).toBeUndefined();
  });
});
