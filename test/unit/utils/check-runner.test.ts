import { EventEmitter } from "node:events";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  CommandNotFoundError,
  findOnPath,
  killProcessTree,
  resolveInvocation,
  runCheckProcess,
  type ProcessSpawner,
} from "src/utils/check-runner.js";
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
      executable: "cmd.exe", args: ["/d", "/s", "/c", "pnpm", "test", "--filter", "a b"],
    });
    expect(resolveInvocation("C:\\tools\\dotnet.exe", ["test"], "win32")).toEqual({
      executable: "C:\\tools\\dotnet.exe", args: ["test"],
    });
    expect(resolveInvocation("dotnet.exe", ["test"], "win32")).toEqual({ executable: "dotnet.exe", args: ["test"] });
    expect(resolveInvocation("npm.cmd", ["test"], "win32")).toEqual({
      executable: "cmd.exe", args: ["/d", "/s", "/c", "npm.cmd", "test"],
    });
    expect(resolveInvocation("C:\\nodejs\\npm.cmd", ["test"], "win32")).toEqual({
      executable: "cmd.exe", args: ["/d", "/s", "/c", "C:\\nodejs\\npm.cmd", "test"],
    });
    expect(resolveInvocation("build.bat", ["arg"], "win32")).toEqual({
      executable: "cmd.exe", args: ["/d", "/s", "/c", "build.bat", "arg"],
    });
    expect(resolveInvocation("npm.cmd", ["test"], "linux")).toEqual({
      executable: "npm.cmd", args: ["test"],
    });
    expect(resolveInvocation("cmd", ["/d", "/c", "echo a && echo b"], "win32")).toEqual({
      executable: "cmd.exe", args: ["/d", "/c", "echo a && echo b"],
    });
    expect(resolveInvocation("cmd.exe", ["/d", "/c", "echo a && echo b"], "win32")).toEqual({
      executable: "cmd.exe", args: ["/d", "/c", "echo a && echo b"],
    });
    expect(resolveInvocation("npm", ["run", "test"], "win32")).toEqual({
      executable: "cmd.exe", args: ["/d", "/s", "/c", "npm", "run", "test"],
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
    pid, stdout: new EventEmitter(), stderr: new EventEmitter(), kill: vi.fn(),
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
      executable: "cmd.exe", args: ["/d", "/s", "/c", '""C:\\Program Files\\nodejs\\pnpm.cmd" run "a b""'], verbatim: true,
    });
  });

  it("routes the upgrade command npm through cmd.exe", () => {
    expect(resolveInvocation("npm", ["install", "--save-dev", "@tamtiger/harnix@latest"], "win32")).toEqual({
      executable: "cmd.exe", args: ["/d", "/s", "/c", "npm", "install", "--save-dev", "@tamtiger/harnix@latest"],
    });
  });

  it("passes the invocation through the injected spawner and honours verbatim arguments", async () => {
    const child = fakeChild();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("C:\\Program Files\\nodejs\\npm.cmd", ["test"], "C:\\repo", {
      platform: "win32",
      spawner,
      systemRoot: "C:\\Windows",
    });
    child.emit("close", 0, null);
    await expect(run).resolves.toEqual({ exitCode: 0, output: "" });
    const [executable, , options] = vi.mocked(spawner).mock.calls[0]!;
    expect(executable).toBe("C:\\Windows\\System32\\cmd.exe");
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
    killProcessTree(777, "win32", spawner, "C:\\Windows");
    expect(spawner).toHaveBeenCalledWith("C:\\Windows\\System32\\taskkill.exe", ["/pid", "777", "/T", "/F"], {
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

describe("check runner executable lookup", () => {
  const dotnetExe = "C:\\Program Files\\dotnet\\dotnet.exe";

  it("runs a bare name that resolves to an executable directly so a pipe in an argument is kept", () => {
    const lookup = (name: string) => (name === "dotnet" ? dotnetExe : undefined);

    expect(resolveInvocation("dotnet", ["test", "--filter", "A|B"], "win32", lookup)).toEqual({
      executable: dotnetExe,
      args: ["test", "--filter", "A|B"],
    });
  });

  it("launches a batch shim found on PATH by its resolved path so cmd.exe never searches the working directory", () => {
    const lookup = () => "C:\\nodejs\\pnpm.CMD";

    expect(resolveInvocation("pnpm", ["test"], "win32", lookup)).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "C:\\nodejs\\pnpm.CMD", "test"],
    });
    expect(resolveInvocation("pnpm", ["a b"], "win32", () => "C:\\Program Files\\nodejs\\pnpm.cmd")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", '""C:\\Program Files\\nodejs\\pnpm.cmd" "a b""'],
      verbatim: true,
    });
    expect(() => resolveInvocation("pnpm", ["a|b"], "win32", lookup)).toThrow(/unsafe for cmd\.exe/u);
  });

  it("refuses a shim whose resolved path holds a cmd metacharacter instead of letting cmd.exe search the working directory", () => {
    expect(() => resolveInvocation("pnpm", ["test"], "win32", () => "C:\\R&D\\pnpm.cmd")).toThrow(
      /unsafe for cmd\.exe/u,
    );
  });

  it("refuses a bare name that PATH cannot resolve so cmd.exe never searches the working directory for it", () => {
    expect(() => resolveInvocation("dotnet", ["test"], "win32", () => undefined)).toThrow(
      "Command not found on PATH: dotnet; use its full path or a name with its extension.",
    );
    expect(() => resolveInvocation("planted", [], "win32", () => undefined)).toThrow(/not found on PATH: planted/u);
  });

  it("still runs the cmd.exe built-ins through cmd.exe and leaves a resolver-less call and other platforms alone", () => {
    for (const builtin of ["dir", "ECHO", "set", "mkdir", "cd"])
      expect(resolveInvocation(builtin, ["x"], "win32", () => undefined)).toEqual({
        executable: "cmd.exe",
        args: ["/d", "/s", "/c", builtin, "x"],
      });
    expect(resolveInvocation("dotnet", ["test"], "win32")).toEqual({
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "dotnet", "test"],
    });
  });

  it("does not look anything up outside Windows", () => {
    const lookup = vi.fn();

    expect(resolveInvocation("dotnet", ["test"], "linux", lookup)).toEqual({ executable: "dotnet", args: ["test"] });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("spawns the resolved executable with the arguments untouched", async () => {
    const child = fakeChild();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("dotnet", ["test", "--filter", "A|B"], "C:\\repo", {
      platform: "win32",
      spawner,
      lookup: () => dotnetExe,
    });
    child.emit("close", 0, null);

    await expect(run).resolves.toEqual({ exitCode: 0, output: "" });
    expect(vi.mocked(spawner).mock.calls[0]?.slice(0, 2)).toEqual([dotnetExe, ["test", "--filter", "A|B"]]);
  });
});

describe("check runner with the real Windows path", () => {
  it.runIf(process.platform === "win32")(
    "runs a bare executable name found on PATH with a pipe in an argument",
    async () => {
      const root = await temporaryRepository();

      const result = await runCheckProcess("node", ["-p", "process.argv[1]", "A|B"], root);

      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe("A|B");
    },
  );

  it.runIf(process.platform === "win32")("runs a command shim found on PATH through the system cmd.exe", async () => {
    const root = await temporaryRepository();

    const result = await runCheckProcess("npm", ["--version"], root);

    expect(result.exitCode).toBe(0);
    expect(result.output.trim()).toMatch(/^\d+\.\d+\.\d+/u);
  });
});

describe("findOnPath", () => {
  it("follows PATH order then PATHEXT order and ignores empty and relative entries", () => {
    const present = new Set(["C:\\a\\dotnet.CMD", "C:\\b\\dotnet.EXE", "tools\\dotnet.EXE", ".\\dotnet.EXE"]);
    const env = { PATH: "C:\\a;;.;tools;C:\\b", PATHEXT: ".COM;.EXE;.CMD" };

    expect(findOnPath("dotnet", env, (candidate) => present.has(candidate))).toBe("C:\\a\\dotnet.CMD");
    present.delete("C:\\a\\dotnet.CMD");
    expect(findOnPath("dotnet", env, (candidate) => present.has(candidate))).toBe("C:\\b\\dotnet.EXE");
  });

  it("uses the default executable extensions when PATHEXT is missing and returns undefined when nothing matches", () => {
    expect(findOnPath("tool", { PATH: "C:\\a" }, (candidate) => candidate === "C:\\a\\tool.EXE")).toBe(
      "C:\\a\\tool.EXE",
    );
    expect(findOnPath("tool", { PATH: "C:\\a" }, () => false)).toBeUndefined();
    expect(findOnPath("tool", {}, () => true)).toBeUndefined();
  });
});

describe("check runner system executables and PATH details on Windows", () => {
  const systemRoot = "C:\\Windows";

  it("starts cmd.exe by its absolute system path so a copy inside the repository is never run", async () => {
    const child = fakeChild();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("echo", ["test"], "C:\\repo", {
      platform: "win32",
      spawner,
      lookup: () => undefined,
      systemRoot,
    });
    child.emit("close", 0, null);
    await run;

    expect(vi.mocked(spawner).mock.calls[0]?.[0]).toBe("C:\\Windows\\System32\\cmd.exe");
  });

  it("reports an unresolved bare name as launcher output with exit 127 and never spawns anything", async () => {
    const spawner: ProcessSpawner = vi.fn();

    const result = await runCheckProcess("planted", [], "C:\\repo", {
      platform: "win32",
      spawner,
      lookup: () => undefined,
      systemRoot,
    });

    expect(result).toEqual({ exitCode: 127, output: expect.stringContaining("Command not found on PATH: planted") });
    expect(spawner).not.toHaveBeenCalled();
  });

  it("runs a wrapper of the same name from the working directory by its own path only when PATH has none", async () => {
    const child = fakeChild();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const exists = (path: string) => path === "C:\\repo\\gradlew.bat";
    const run = runCheckProcess("gradlew", ["test"], "C:\\repo", {
      exists,
      lookup: () => undefined,
      platform: "win32",
      spawner,
      systemRoot,
    });
    child.emit("close", 0, null);
    await run;

    expect(vi.mocked(spawner).mock.calls[0]?.[1]).toEqual(["/d", "/s", "/c", "C:\\repo\\gradlew.bat", "test"]);
  });

  it("does not rewrite an executable that is launched directly", async () => {
    const child = fakeChild();
    const spawner: ProcessSpawner = vi.fn(() => child as never);
    const run = runCheckProcess("dotnet", ["test"], "C:\\repo", {
      platform: "win32",
      spawner,
      lookup: () => "C:\\tools\\dotnet.exe",
      systemRoot,
    });
    child.emit("close", 0, null);
    await run;

    expect(vi.mocked(spawner).mock.calls[0]?.[0]).toBe("C:\\tools\\dotnet.exe");
  });

  it("looks up a direct executable name with an extension on PATH", () => {
    const lookup = vi.fn(() => "C:\\tools\\dotnet.exe");
    expect(resolveInvocation("dotnet.exe", ["test"], "win32", lookup)).toEqual({
      executable: "C:\\tools\\dotnet.exe",
      args: ["test"],
    });
    expect(lookup).toHaveBeenCalledWith("dotnet.exe");
  });

  it("throws CommandNotFoundError when a direct executable name with an extension is not on PATH", () => {
    const lookup = vi.fn(() => undefined);
    expect(() => resolveInvocation("missing.exe", ["test"], "win32", lookup)).toThrow(CommandNotFoundError);
    expect(lookup).toHaveBeenCalledWith("missing.exe");
  });

  it("does not append extension in findOnPath when name already ends with an extension from PATHEXT", () => {
    const env = { PATH: "C:\\tools;C:\\other", PATHEXT: ".COM;.EXE" };
    const checkedCandidates: string[] = [];
    const exists = (candidate: string): boolean => (checkedCandidates.push(candidate), candidate === "C:\\other\\dotnet.exe");

    expect(findOnPath("dotnet.exe", env, exists)).toBe("C:\\other\\dotnet.exe");
    expect(checkedCandidates).toEqual(["C:\\tools\\dotnet.exe", "C:\\other\\dotnet.exe"]);
  });

  it("resolves a PATH entry that is wrapped in quotes", () => {
    const env = { PATH: '"C:\\Program Files\\dotnet";C:\\other', PATHEXT: ".EXE" };
    expect(findOnPath("dotnet", env, (candidate) => candidate === "C:\\Program Files\\dotnet\\dotnet.EXE")).toBe(
      "C:\\Program Files\\dotnet\\dotnet.EXE",
    );
  });
});
