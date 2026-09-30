import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveInvocation, runCheckProcess } from "src/utils/check-runner.js";
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
  });

  it("rejects cmd metacharacters in arguments for the Windows shim route", () => {
    for (const bad of ["a&b", "a|b", "a<b", "a>b", "a^b", "a%b", 'a"b', "a\nb"]) {
      expect(() => resolveInvocation("pnpm", [bad], "win32")).toThrow(/unsafe/u);
    }
  });
});
