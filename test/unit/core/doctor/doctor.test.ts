import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { runDoctor, type DoctorDeps } from "src/core/doctor/doctor.js";
import { GlobalManagedTransactionError } from "src/core/global/managed-files.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-run-");
const temporaryUserHome = useTemporaryUserHomes("harnix-doctor-run-home-");

interface Calls {
  project: number;
  global: number;
}

function deps(calls: Calls, overrides: Partial<DoctorDeps> = {}): DoctorDeps {
  return {
    plans: { desired: () => [], memberMatchers: () => undefined },
    generatorVersion: "2.0.0",
    defaultCommandLookup: () => Promise.resolve(true),
    desiredPaths: () => [],
    fixProject: () => {
      calls.project += 1;
      return Promise.resolve(2);
    },
    fixGlobal: () => {
      calls.global += 1;
      return Promise.resolve({ platforms: [{ created: ["a"], updated: ["b", "c"] }] });
    },
    ...overrides,
  };
}

async function setup() {
  const root = await temporaryRepository();
  const home = await temporaryUserHome();
  await initializeProject({ developer: "tam", root, yes: true });
  return { root, home, homeResolver: () => Promise.resolve(home), commandLookup: () => Promise.resolve(true) };
}

describe("doctor run", () => {
  it("reports project and global sections without fixing anything by default", async () => {
    const { root, homeResolver, commandLookup } = await setup();
    const calls = { project: 0, global: 0 };

    const report = await runDoctor({ root, homeResolver, commandLookup, environment: {} }, deps(calls));

    expect(report).toMatchObject({ schemaVersion: 2, generator: "harnix" });
    expect(report.globalIntegrations).toHaveLength(6);
    expect(report.summary.fixed).toBe(0);
    expect(calls).toEqual({ project: 0, global: 0 });
  });

  it("fixes only project state on a project-only --fix", async () => {
    const { root, homeResolver, commandLookup } = await setup();
    const calls = { project: 0, global: 0 };

    const report = await runDoctor({ root, fix: true, homeResolver, commandLookup, environment: {} }, deps(calls));

    expect(calls).toEqual({ project: 1, global: 0 });
    expect(report.summary.fixed).toBeGreaterThanOrEqual(2);
  });

  it("fixes only global integrations on --fix --global", async () => {
    const { root, homeResolver, commandLookup } = await setup();
    const calls = { project: 0, global: 0 };

    const report = await runDoctor(
      { root, fix: true, global: true, homeResolver, commandLookup, environment: {} },
      deps(calls),
    );

    expect(calls).toEqual({ project: 0, global: 1 });
    expect(report.summary.fixed).toBe(3);
  });

  it("keeps diagnosing when a fix fails and reports a partial rollback on its platform", async () => {
    const { root, homeResolver, commandLookup } = await setup();
    const calls = { project: 0, global: 0 };
    const failing = deps(calls, {
      fixGlobal: () =>
        Promise.reject(
          new GlobalManagedTransactionError(
            "failed",
            { restored: [], partial: ["~/.claude/CLAUDE.md"] },
            new Error("x"),
          ),
        ),
    });

    const report = await runDoctor(
      { root, fix: true, global: true, homeResolver, commandLookup, environment: {} },
      failing,
    );

    const claude = report.globalIntegrations.find((item) => item.platform === "claude");
    expect(claude?.findings).toContainEqual(
      expect.objectContaining({ code: "global-partial-rollback", path: "~/.claude/CLAUDE.md" }),
    );
    expect(claude?.status).toBe("drifted");
  });

  it("swallows a failing project fix and still reports", async () => {
    const { root, homeResolver, commandLookup } = await setup();
    const calls = { project: 0, global: 0 };

    const report = await runDoctor(
      { root, fix: true, homeResolver, commandLookup, environment: {} },
      deps(calls, { fixProject: () => Promise.reject(new Error("boom")) }),
    );

    expect(report.project.status).toBeDefined();
  });
});
