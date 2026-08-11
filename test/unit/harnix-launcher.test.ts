import { mkdir, writeFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { describe, expect, it } from "vitest";

import { lookupHarnixLauncher } from "../../src/utils/harnix-launcher.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-launcher-");

describe("Harnix launcher lookup", () => {
  it("should_probe_a_windows_cmd_shim_through_a_fixed_cmd_exe_invocation", async () => {
    const calls: Array<{ executable: string; args: readonly string[] }> = [];

    const found = await lookupHarnixLauncher({
      platform: "win32",
      runner: async (executable, args) => {
        calls.push({ executable, args });
      },
    });

    expect(found).toBe(true);
    expect(calls).toEqual([{
      executable: "cmd.exe",
      args: ["/d", "/s", "/c", "harnix --version"],
    }]);
  });

  it("should_probe_the_direct_constant_binary_on_non_windows_platforms", async () => {
    const calls: Array<{ executable: string; args: readonly string[] }> = [];

    const found = await lookupHarnixLauncher({
      platform: "linux",
      runner: async (executable, args) => {
        calls.push({ executable, args });
      },
    });

    expect(found).toBe(true);
    expect(calls).toEqual([{ executable: "harnix", args: ["--version"] }]);
  });

  it("should_report_unavailable_when_the_fixed_launcher_probe_fails", async () => {
    await expect(lookupHarnixLauncher({
      platform: "win32",
      runner: async () => {
        throw new Error("missing shim");
      },
    })).resolves.toBe(false);
  });

  it.runIf(process.platform === "win32")("should_resolve_a_windows_cmd_shim_when_it_is_on_path", async () => {
    const home = await temporaryUserHome();
    const shimDirectory = join(home, "bin");
    await mkdir(shimDirectory, { recursive: true });
    await writeFile(join(shimDirectory, "harnix.cmd"), "@echo off\r\nexit /b 0\r\n", "utf8");
    const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
    const originalPath = process.env[pathKey];
    process.env[pathKey] = `${shimDirectory}${delimiter}${originalPath ?? ""}`;
    try {
      await expect(lookupHarnixLauncher()).resolves.toBe(true);
    } finally {
      if (originalPath === undefined) delete process.env[pathKey];
      else process.env[pathKey] = originalPath;
    }
  });
});
