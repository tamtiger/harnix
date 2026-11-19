import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

import { GREETER_CLI_SOURCE, startOrderApi, type RunningApi } from "test/support/exercise-fixtures.js";

const run = promisify(execFile);
const cleanups: (() => Promise<void>)[] = [];

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function waitUntilReady(baseUrl: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      if ((await fetch(`${baseUrl}/health`)).ok) return;
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) throw new Error("target never became ready");
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function startApi(): Promise<RunningApi> {
  const api = await startOrderApi();
  cleanups.push(() => api.stop());
  await waitUntilReady(api.baseUrl, 2000);
  return api;
}

describe("harnix-exercise procedure on disposable fixtures", () => {
  it("starts an API on a free port, probes readiness and asserts happy, boundary and error scenarios", async () => {
    const api = await startApi();

    const happy = await fetch(`${api.baseUrl}/orders/1`);
    expect(happy.status).toBe(200);
    expect(await happy.json()).toEqual({ id: "1", item: "book" });

    const unknown = await fetch(`${api.baseUrl}/orders/999`);
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ error: "not-found" });

    const invalid = await fetch(`${api.baseUrl}/orders`, { method: "DELETE" });
    expect(invalid.status).toBe(400);
  });

  it("releases the port after stop, so no child resource outlives the run", async () => {
    const api = await startOrderApi();
    await waitUntilReady(api.baseUrl, 2000);
    await api.stop();
    await expect(fetch(`${api.baseUrl}/health`)).rejects.toThrow();
  });

  it("runs a CLI by executable plus argument array and asserts stdout, stderr and exit code separately", async () => {
    const directory = await mkdtemp(join(tmpdir(), "harnix-exercise-"));
    cleanups.push(() => rm(directory, { recursive: true, force: true }));
    const script = join(directory, "greeter.mjs");
    await writeFile(script, GREETER_CLI_SOURCE, "utf8");

    const success = await run(process.execPath, [script, "an user | with spaces"], { timeout: 10_000 });
    expect(success.stdout).toBe("hello an user | with spaces\n");
    expect(success.stderr).toBe("");

    const failure = await run(process.execPath, [script], { timeout: 10_000 }).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 2, stdout: "", stderr: "usage: greeter <name>\n" });
  });
});
