import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

import { killProcessTree, runCheckProcess, type ProcessSpawner } from "src/utils/check-runner.js";

interface FakeChild extends EventEmitter {
  pid: number;
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: ReturnType<typeof vi.fn>;
}

function fakeChild(pid = 4242): FakeChild {
  return Object.assign(new EventEmitter(), {
    pid,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(),
  });
}

describe("check runner timeout and output decoding", () => {
  it("reports exit code 124 after a timeout even when the killed process closes with another code", async () => {
    const child = fakeChild(777);
    const killer = vi.fn();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("dotnet.exe", ["test"], "C:\\repo", {
      platform: "win32",
      spawner,
      killer,
      lookup: () => "C:\\Program Files\\dotnet\\dotnet.exe",
      timeoutMs: 5,
    });
    await new Promise((resolve) => setTimeout(resolve, 60));
    child.emit("close", 1, null);
    const result = await run;
    expect(killer).toHaveBeenCalledWith(777, "win32");
    expect(result.exitCode).toBe(124);
    expect(result.output).toContain("[timed out]");
  });

  it("keeps the real exit code when no timeout happened", async () => {
    const child = fakeChild();
    const run = runCheckProcess("dotnet.exe", ["test"], "C:\\repo", {
      platform: "win32",
      spawner: vi.fn(() => child as never),
      lookup: () => "C:\\Program Files\\dotnet\\dotnet.exe",
    });
    child.emit("close", 3, null);
    await expect(run).resolves.toMatchObject({ exitCode: 3 });
  });

  it("does not split a multi-byte character that arrives across two chunks", async () => {
    const child = fakeChild();
    const run = runCheckProcess("node", ["-v"], "/repo", { platform: "linux", spawner: vi.fn(() => child as never) });
    const bytes = Buffer.from("đã xong", "utf8");
    child.stdout.emit("data", bytes.subarray(0, 1));
    child.stdout.emit("data", bytes.subarray(1));
    child.emit("close", 0, null);
    await expect(run).resolves.toEqual({ exitCode: 0, output: "đã xong" });
  });

  it("starts the child as a process-group leader on POSIX so a timeout can end its children", async () => {
    const child = fakeChild();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("pnpm", ["test"], "/repo", { platform: "linux", spawner });
    child.emit("close", 0, null);
    await run;
    expect(vi.mocked(spawner).mock.calls[0]![2]).toMatchObject({ detached: true, shell: false });
  });

  it("kills the whole process group on POSIX and falls back to the single process", () => {
    const kill = vi.fn((pid: number) => {
      if (pid < 0) throw Object.assign(new Error("no such group"), { code: "ESRCH" });
      return true;
    });
    const originalKill = process.kill;
    process.kill = kill as never;
    try {
      killProcessTree(888, "linux", vi.fn());
    } finally {
      process.kill = originalKill;
    }
    expect(kill.mock.calls.map((call) => call[0])).toEqual([-888, 888]);
  });
});
