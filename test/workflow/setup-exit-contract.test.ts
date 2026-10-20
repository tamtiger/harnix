import { describe, expect, it } from "vitest";

interface SetupRun {
  status: number;
  stderr: string;
  stdout: string;
}
interface SetupExitContract {
  assertSetupExitContract(run: SetupRun): void;
}

const { assertSetupExitContract } = (await import(
  new URL("../../scripts/setup-exit-contract.mjs", import.meta.url).href
)) as SetupExitContract;

function setupRun(status: number, stderr: string, platforms: unknown[]): SetupRun {
  return { status, stderr, stdout: JSON.stringify({ scope: "user", platforms }) };
}

describe("measure:footprint setup exit contract", () => {
  it("accepts exit 0 with the informational Codex and Antigravity notices on stderr", () => {
    const platforms = [
      { platform: "kiro", readiness: "installed", warnings: [] },
      { platform: "antigravity", readiness: "precedence-unknown", warnings: ["notice"] },
      { platform: "codex", readiness: "installed-pending-trust", warnings: ["Review and trust the hook."] },
    ];
    expect(() => assertSetupExitContract(setupRun(0, "codex: Review and trust the hook.\n", platforms))).not.toThrow();
  });

  it("requires exit 1 when a platform readiness needs action", () => {
    const platforms = [{ platform: "codex", readiness: "drifted", warnings: [] }];
    expect(() => assertSetupExitContract(setupRun(0, "", platforms))).toThrow(/expected 1/u);
    expect(() => assertSetupExitContract(setupRun(1, "codex: setup readiness is drifted.\n", platforms))).not.toThrow();
  });

  it("rejects exit 1 that is not explained on stderr and unexpected exit codes", () => {
    const platforms = [{ platform: "kiro", readiness: "installed", warnings: [] }];
    expect(() => assertSetupExitContract(setupRun(1, "", platforms))).toThrow(/without explaining/u);
    expect(() => assertSetupExitContract(setupRun(2, "boom", platforms))).toThrow(/expected 0 or 1/u);
  });

  it("rejects output that is not the global JSON result", () => {
    expect(() => assertSetupExitContract({ status: 0, stderr: "", stdout: "not json" })).toThrow(/valid JSON/u);
    expect(() => assertSetupExitContract({ status: 0, stderr: "", stdout: "{}" })).toThrow(/unexpected global result/u);
  });
});
