import { EventEmitter } from "node:events";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { killProcessTree, resolveInvocation, runCheckProcess, type ProcessSpawner } from "src/utils/check-runner.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("check runner", () => {
  it("runs an executable with an argument array and captures combined output and exit code", async () => {
    const root = await temporaryRepository();

    const ok = await runCheckProcess(process.execPath, ["-e", "console.log('out'); console.error('err')"], root);
    const failing = await runCheckProcess(process.execPath, ["-e", "process.exit(7)"], root);

    expect(ok.exitCode).toBe(0);
    expect(ok.output).toContain("out");
    expect(ok.output).toContain("err");
    expect(failing.exitCode).toBe(7);
  });

  it("runs an executable in the specified cwd subdirectory", async () => {
    const root = await temporaryRepository();
    const { mkdir } = await import("node:fs/promises");
    const subDir = join(root, "packages", "sub-repo");
    await mkdir(subDir, { recursive: true });

    const result = await runCheckProcess(process.execPath, ["-e", "console.log(process.cwd())"], subDir);
    expect(result.exitCode).toBe(0);
    // Normalize path separators for Windows comparison
    expect(result.output.trim().replace(/\\/g, "/")).toContain("packages/sub-repo");
  });

  it("does not interpret shell metacharacters in arguments", async () => {
    const root = await temporaryRepository();

    const result = await runCheckProcess(process.execPath, ["-p", "process.argv[1]", "a && b"], root);

    expect(result.output.trim()).toBe("a && b");
  });

  it("reports an executable that cannot start", async () => {
    const root = await temporaryRepository();

    await expect(runCheckProcess(join(root, "missing-binary"), [], root)).rejects.toThrow(/start/u);
  });

  it("keeps direct invocation on posix and routes bare command names through cmd.exe on Windows", () => {
    expect(resolveInvocation("pnpm", ["test"], "linux")).toEqual({ executable: "pnpm", args: ["test"] });
    expect(resolveInvocation("pnpm", ["test", "--filter", "a b"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "pnpm", "test", "--filter", "a b"],
    });
    expect(resolveInvocation("C:\\tools\\dotnet.exe", ["test"], "win32")).toEqual({
      executable: "C:\\tools\\dotnet.exe",
      args: ["test"],
    });
    expect(resolveInvocation("dotnet.exe", ["test"], "win32")).toEqual({ executable: "dotnet.exe", args: ["test"] });
    expect(resolveInvocation("npm.cmd", ["test"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd", "test"],
    });
    expect(resolveInvocation("C:\\nodejs\\npm.cmd", ["test"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "C:\\nodejs\\npm.cmd", "test"],
    });
    expect(resolveInvocation("build.bat", ["arg"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "build.bat", "arg"],
    });
    expect(resolveInvocation("npm.cmd", ["test"], "linux")).toEqual({
      executable: "npm.cmd",
      args: ["test"],
    });
    expect(resolveInvocation("cmd", ["/d", "/c", "echo a && echo b"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/c", "echo a && echo b"],
    });
    expect(resolveInvocation("cmd.exe", ["/d", "/c", "echo a && echo b"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/c", "echo a && echo b"],
    });
    expect(resolveInvocation("npm", ["run", "test"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "npm", "run", "test"],
    });
  });

  it("rejects cmd metacharacters in arguments for the Windows shim route", () => {
    for (const bad of ["a&b", "a|b", "a<b", "a>b", "a^b", "a%b", 'a"b', "a\nb"]) {
      expect(() => resolveInvocation("pnpm", [bad], "win32")).toThrow(/unsafe/u);
    }
  });

  it("tells the caller how to run a compound command when a Windows shim argument is unsafe", () => {
    expect(() => resolveInvocation("pwsh", ["-Command", "a && b"], "win32")).toThrow(
      /unsafe for cmd.exe.*name with its extension.*pwsh.exe.*full path/su,
    );
  });
});

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

describe("check runner on Windows", () => {
  it("rejects cmd metacharacters in the executable as well as in the arguments", () => {
    expect(() => resolveInvocation("pnpm&calc", ["test"], "win32")).toThrow(/unsafe for cmd\.exe/u);
    expect(() => resolveInvocation("tools\\run%PATH%.cmd", [], "win32")).toThrow(/unsafe for cmd\.exe/u);
    expect(() => resolveInvocation("build.cmd", ["a|b"], "win32")).toThrow(/unsafe for cmd\.exe/u);
  });

  it("launches a .cmd path containing spaces with one quoted command line and verbatim arguments", () => {
    expect(resolveInvocation("C:\\Program Files\\nodejs\\pnpm.cmd", ["run", "a b"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", '""C:\\Program Files\\nodejs\\pnpm.cmd" run "a b""'],
      verbatim: true,
    });
  });

  it("routes the upgrade command npm through cmd.exe", () => {
    expect(resolveInvocation("npm", ["install", "--save-dev", "@tamtiger/harnix@latest"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "npm", "install", "--save-dev", "@tamtiger/harnix@latest"],
    });
  });

  it("passes the invocation through the injected spawner and honours verbatim arguments", async () => {
    const child = fakeChild();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("C:\\Program Files\\nodejs\\npm.cmd", ["test"], "C:\\repo", {
      platform: "win32",
      spawner,
    });
    child.emit("close", 0, null);
    await expect(run).resolves.toEqual({ exitCode: 0, output: "" });
    const [executable, , options] = vi.mocked(spawner).mock.calls[0]!;
    expect(executable).toBe("cmd.exe");
    expect(options).toMatchObject({ shell: false, windowsVerbatimArguments: true });
  });

  it("kills the whole process tree with taskkill when a check times out", async () => {
    const child = fakeChild(777);
    const killer = vi.fn();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("dotnet.exe", ["test"], "C:\\repo", {
      platform: "win32",
      spawner,
      killer,
      timeoutMs: 5,
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    child.emit("close", null, "SIGTERM");
    const result = await run;
    expect(killer).toHaveBeenCalledWith(777, "win32");
    expect(result.output).toContain("[timed out]");
    expect(result.exitCode).toBe(124);
  });

  it("builds a fixed taskkill argument array for the tree and plain kill elsewhere", () => {
    const spawner = vi.fn();
    killProcessTree(777, "win32", spawner);
    expect(spawner).toHaveBeenCalledWith("taskkill", ["/pid", "777", "/T", "/F"], {
      shell: false,
      windowsHide: true,
      stdio: "ignore",
    });
    const kill = vi.fn();
    const originalKill = process.kill;
    process.kill = kill as never;
    try {
      killProcessTree(888, "linux", spawner);
    } finally {
      process.kill = originalKill;
    }
    expect(kill).toHaveBeenCalledWith(888);
  });
});
