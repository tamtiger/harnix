import { describe, expect, it } from "vitest";

import { upgradeHarnix } from "src/commands/upgrade.js";

describe("upgradeHarnix", () => {
  it("should_report_an_explicit_null_when_the_offline_available_version_is_unknown", async () => {
    await expect(upgradeHarnix({ installedVersion: "0.1.0" })).resolves.toEqual({
      installed: "0.1.0",
      available: null,
      command: ["npm", "install", "--save-dev", "@tamtiger/harnix@latest"],
      applied: false,
    });
  });

  it("should_remain_offline_until_an_explicit_apply_runner_is_requested", async () => {
    let ran = false;

    await expect(
      upgradeHarnix({
        installedVersion: "0.1.0",
        availableVersion: async () => "0.2.0",
        runner: async () => {
          ran = true;
        },
      }),
    ).resolves.toMatchObject({ available: "0.2.0", applied: false });
    expect(ran).toBe(false);

    await upgradeHarnix({
      installedVersion: "0.1.0",
      apply: true,
      runner: async (executable, args) => {
        ran = executable === "npm" && args[0] === "install";
      },
    });

    expect(ran).toBe(true);
  });

  it("should_run_the_default_apply_path_through_the_shared_check_runner", async () => {
    const calls: [string, readonly string[]][] = [];
    const result = await upgradeHarnix({
      installedVersion: "0.1.0",
      apply: true,
      checkRunner: async (executable, args) => {
        calls.push([executable, args]);
        return { exitCode: 0, output: "" };
      },
    });
    expect(calls).toEqual([["npm", ["install", "--save-dev", "@tamtiger/harnix@latest"]]]);
    expect(result.applied).toBe(true);
  });

  it("should_fail_when_the_upgrade_process_exits_non_zero", async () => {
    await expect(
      upgradeHarnix({ installedVersion: "0.1.0", apply: true, checkRunner: async () => ({ exitCode: 3, output: "" }) }),
    ).rejects.toThrow(/code 3/u);
  });
});
