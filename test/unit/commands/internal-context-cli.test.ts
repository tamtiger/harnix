import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { parseOptionalHookInput, runInternalContextCommand } from "src/commands/internal-context-cli.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-context-cli-");

afterEach(() => vi.restoreAllMocks());

function captureStdout(): { writes: () => string[] } {
  const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  return { writes: () => spy.mock.calls.map((call) => String(call[0])) };
}

describe.sequential("parseOptionalHookInput", () => {
  it("returns undefined for missing or blank input", () => {
    expect(parseOptionalHookInput(undefined)).toBeUndefined();
    expect(parseOptionalHookInput("")).toBeUndefined();
    expect(parseOptionalHookInput("  \n\t ")).toBeUndefined();
  });

  it("parses well-formed JSON of any shape", () => {
    expect(parseOptionalHookInput('{"cwd":"/work","hook_event_name":"UserPromptSubmit"}')).toEqual({
      cwd: "/work",
      hook_event_name: "UserPromptSubmit",
    });
    expect(parseOptionalHookInput("[1,2]")).toEqual([1, 2]);
    expect(parseOptionalHookInput(" 42 ")).toBe(42);
  });

  it("treats malformed JSON as absent input instead of throwing", () => {
    expect(parseOptionalHookInput("{not-json")).toBeUndefined();
    expect(parseOptionalHookInput('{"cwd":')).toBeUndefined();
  });
});

describe("runInternalContextCommand", () => {
  it("is an output-free no-op outside an initialized project", async () => {
    const uninitialized = await temporaryRepository();
    const stdout = captureStdout();

    await runInternalContextCommand({ platform: "codex", fallbackCwd: uninitialized });
    await runInternalContextCommand({
      platform: "kiro",
      hookInput: '{"cwd":"' + "x".repeat(10) + '"}',
      fallbackCwd: uninitialized,
    });

    expect(stdout.writes()).toEqual([]);
  });

  it("writes exactly one newline-terminated document for an initialized project", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const stdout = captureStdout();

    await runInternalContextCommand({ platform: "codex", fallbackCwd: root });

    const writes = stdout.writes();
    expect(writes).toHaveLength(1);
    expect(writes[0]!.endsWith("\n")).toBe(true);
    expect(writes[0]!.trim().length).toBeGreaterThan(0);
  });

  it("falls back to the given cwd when the hook input is malformed JSON", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const stdout = captureStdout();

    await runInternalContextCommand({ platform: "codex", hookInput: "{not-json", fallbackCwd: root });
    const fromMalformed = stdout.writes();
    await runInternalContextCommand({ platform: "codex", fallbackCwd: root });

    expect(fromMalformed).toHaveLength(1);
    expect(stdout.writes()).toEqual([fromMalformed[0], fromMalformed[0]]);
  });

  it("defaults the fallback cwd to the current directory", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const original = process.cwd();
    const stdout = captureStdout();
    process.chdir(root);
    try {
      await runInternalContextCommand({ platform: "codex" });
    } finally {
      process.chdir(original);
    }

    expect(stdout.writes()).toHaveLength(1);
  });
});

function preToolUse(cwd: string, pattern: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    cwd,
    hook_event_name: "PreToolUse",
    session_id: "session-1",
    tool_input: { pattern },
    tool_name: "Grep",
    ...extra,
  });
}

describe("runInternalContextCommand for PreToolUse", () => {
  it("writes one reminder document for a symbol search in an initialized project", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const stdout = captureStdout();

    await runInternalContextCommand({
      platform: "claude",
      hookInput: preToolUse(root, "holds_stock"),
      fallbackCwd: root,
    });

    const writes = stdout.writes();
    expect(writes).toHaveLength(1);
    const output = JSON.parse(writes[0]!) as {
      hookSpecificOutput: { hookEventName: string; additionalContext: string };
    };
    expect(output.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(output.hookSpecificOutput.additionalContext).toContain("--refs holds_stock");
  });

  it("is silent for a text search, another tool, or a non-Claude platform", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const stdout = captureStdout();

    await runInternalContextCommand({
      platform: "claude",
      hookInput: preToolUse(root, "two words"),
      fallbackCwd: root,
    });
    await runInternalContextCommand({
      platform: "claude",
      hookInput: preToolUse(root, "holds_stock", { tool_name: "Read" }),
      fallbackCwd: root,
    });
    await runInternalContextCommand({
      platform: "codex",
      hookInput: preToolUse(root, "holds_stock"),
      fallbackCwd: root,
    });

    expect(stdout.writes()).toEqual([]);
  });

  it("is an output-free no-op outside an initialized project", async () => {
    const uninitialized = await temporaryRepository();
    const stdout = captureStdout();

    await runInternalContextCommand({
      platform: "claude",
      hookInput: preToolUse(uninitialized, "holds_stock"),
      fallbackCwd: uninitialized,
    });

    expect(stdout.writes()).toEqual([]);
  });

  it("writes nothing to the project: no session cache slot, no tmp directory", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const stdout = captureStdout();

    await runInternalContextCommand({
      platform: "claude",
      hookInput: preToolUse(root, "holds_stock"),
      fallbackCwd: root,
    });
    await runInternalContextCommand({
      platform: "claude",
      hookInput: preToolUse(root, "holds_stock"),
      fallbackCwd: root,
    });

    expect(stdout.writes()).toHaveLength(2);
    expect(existsSync(join(root, ".harnix", "tmp", "context-cache"))).toBe(false);
  });

  it("keeps UserPromptSubmit behavior: context text, never the reminder JSON", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const stdout = captureStdout();

    await runInternalContextCommand({
      platform: "claude",
      hookInput: JSON.stringify({ cwd: root, hook_event_name: "UserPromptSubmit" }),
      fallbackCwd: root,
    });

    const writes = stdout.writes();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain("repo-map");
    expect(writes[0]).not.toContain("hookSpecificOutput");
  });
});
