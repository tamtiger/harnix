// harnix-secret-waiver: the token, password and api key below are made-up values for the redaction test.
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CHECK_LOG_DIRECTORY, removeCheckLog, writeCheckLog } from "src/core/workflow/check-log.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

async function project(): Promise<{ root: string; harnixRoot: string }> {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  return { root, harnixRoot: await resolveSafeHarnixPath(root) };
}

const logFile = (root: string, name: string) => join(root, ".harnix", "tmp", "check-logs", name);

describe("check log", () => {
  it("writes the cleaned output under .harnix/tmp/check-logs and returns the relative POSIX path", async () => {
    const { root, harnixRoot } = await project();

    const path = await writeCheckLog(
      harnixRoot,
      "chk-focused",
      "\u001b[31mFAIL\u001b[0m at C:\\Users\\dev\\proj\\a.ts\nsecond line\n",
    );

    expect(CHECK_LOG_DIRECTORY).toBe(".harnix/tmp/check-logs");
    expect(path).toBe(".harnix/tmp/check-logs/chk-focused.log");
    const text = await readFile(logFile(root, "chk-focused.log"), "utf8");
    expect(text).toContain("FAIL at <path>");
    expect(text).toContain("second line");
    expect(text).not.toContain("\u001b");
    expect(text).not.toContain("Users");
  });

  it("masks vendor tokens, connection-string passwords and credential assignments", async () => {
    const { root, harnixRoot } = await project();
    const token = `ghp_${"a".repeat(36)}`;

    await writeCheckLog(
      harnixRoot,
      "chk-secret",
      `token ${token}\nPassword=hunter22secret;Server=db\napi_key: "abcdef123456"\nplain line\n`,
    );

    const text = await readFile(logFile(root, "chk-secret.log"), "utf8");
    expect(text).not.toContain(token);
    expect(text).not.toContain("hunter22secret");
    expect(text).not.toContain("abcdef123456");
    expect(text).toContain("<redacted>");
    expect(text).toContain("plain line");
  });

  it("masks an Authorization header and unquoted credential lines, which a failing check often prints", async () => {
    const { root, harnixRoot } = await project();

    await writeCheckLog(
      harnixRoot,
      "chk-auth",
      "Authorization: Bearer abcdef1234567890abcdef\ntoken=abcd1234efgh5678\nAPI_KEY=sk-live-abcdef\nsecret: abcdefghijk123\nplain line\n",
    );

    const text = await readFile(logFile(root, "chk-auth.log"), "utf8");
    for (const value of ["abcdef1234567890abcdef", "abcd1234efgh5678", "sk-live-abcdef", "abcdefghijk123"])
      expect(text).not.toContain(value);
    expect(text).toContain("API_KEY=<redacted>");
    expect(text).toContain("plain line");
  });

  it("keeps at most 64 KiB, the tail of the output, and says it was cut", async () => {
    const { root, harnixRoot } = await project();

    // Many ordinary lines: one single line this long is cut by the redaction itself (see output-redaction-performance).
    await writeCheckLog(harnixRoot, "chk-big", `${"a line of output\n".repeat(6000)}THE-END`);

    const text = await readFile(logFile(root, "chk-big.log"), "utf8");
    expect(text.length).toBeLessThanOrEqual(65_536 + 40);
    expect(text.startsWith("[truncated]")).toBe(true);
    expect(text).toContain("THE-END");
  });

  it("replaces the previous log of the same check", async () => {
    const { root, harnixRoot } = await project();

    await writeCheckLog(harnixRoot, "chk-a", "first run");
    await writeCheckLog(harnixRoot, "chk-a", "second run");

    expect(await readFile(logFile(root, "chk-a.log"), "utf8")).toBe("second run\n");
  });

  it("never leaves the log directory, whatever the check id looks like", async () => {
    const { root, harnixRoot } = await project();

    const path = await writeCheckLog(harnixRoot, "../evil", "boom");

    expect(path).toMatch(/^\.harnix\/tmp\/check-logs\/[^/]+\.log$/u);
    await expect(stat(join(root, ".harnix", "tmp", "evil.log"))).rejects.toThrow();
    await expect(stat(join(root, path))).resolves.toBeDefined();
  });

  it("removes a stale log and stays silent when there is none", async () => {
    const { root, harnixRoot } = await project();
    await mkdir(join(root, ".harnix", "tmp", "check-logs"), { recursive: true });
    await writeFile(logFile(root, "chk-old.log"), "old");

    await removeCheckLog(harnixRoot, "chk-old");
    await removeCheckLog(harnixRoot, "chk-never");

    await expect(stat(logFile(root, "chk-old.log"))).rejects.toThrow();
  });
});
