import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Step {
  readonly command: string;
  readonly args: readonly string[];
}
interface ReleaseCheck {
  RELEASE_STEPS: readonly Step[];
  runReleaseChecks(
    run: (step: Step) => { status: number | null },
    write: (line: string) => void,
    clock?: () => number,
  ): { ok: boolean; failed?: string; ran: string[] };
}

const { RELEASE_STEPS, runReleaseChecks } = (await import(
  new URL("../../scripts/release-check.mjs", import.meta.url).href
)) as ReleaseCheck;

const label = (step: Step) => [step.command, ...step.args].join(" ");

describe("pnpm release:check", () => {
  it("runs the acceptance sequence of IMPLEMENTATION_PLAN section 11, in order", () => {
    expect(RELEASE_STEPS.map(label)).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm build",
      "pnpm lint",
      "pnpm typecheck",
      "pnpm test",
      "pnpm pack:check",
      "pnpm smoke:tarball",
      "pnpm measure:init",
      "pnpm measure:footprint",
      "pnpm scan:release",
      "git diff --check",
    ]);
  });

  it("matches the sequence documented in IMPLEMENTATION_PLAN section 11", () => {
    const plan = readFileSync("docs/IMPLEMENTATION_PLAN.md", "utf8");
    const section = plan.slice(
      plan.indexOf("## 11. Acceptance command sequence"),
      plan.indexOf("## 12. Risk register"),
    );
    const fence = /```text\r?\n([\s\S]*?)```/u;
    const documented = (fence.exec(section)?.[1] ?? "").split(/\r?\n/u).filter(Boolean);

    expect(RELEASE_STEPS.map(label)).toEqual(documented);
  });

  it("prints every command with its exit code and duration and reports success", () => {
    const lines: string[] = [];
    let now = 0;

    const result = runReleaseChecks(
      () => ({ status: 0 }),
      (line) => lines.push(line),
      () => (now += 1500),
    );

    expect(result).toMatchObject({ ok: true });
    expect(result.ran).toHaveLength(RELEASE_STEPS.length);
    expect(lines).toContain("pnpm build => exit 0 in 1.5s");
  });

  it("stops at the first failing command and names it", () => {
    const seen: string[] = [];

    const result = runReleaseChecks(
      (step) => {
        seen.push(label(step));
        return { status: label(step) === "pnpm lint" ? 1 : 0 };
      },
      () => undefined,
    );

    expect(result).toMatchObject({ ok: false, failed: "pnpm lint" });
    expect(seen).toEqual(["pnpm install --frozen-lockfile", "pnpm build", "pnpm lint"]);
  });

  it("treats a command that could not start as a failure", () => {
    expect(
      runReleaseChecks(
        () => ({ status: null }),
        () => undefined,
      ),
    ).toMatchObject({
      ok: false,
      failed: "pnpm install --frozen-lockfile",
    });
  });
});
