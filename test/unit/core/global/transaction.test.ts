import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { applyPlans, buildPlans, captureSnapshot } from "src/core/global/transaction.js";
import { GlobalManagedTransactionError, type TargetState } from "src/core/global/types.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-transaction-");

describe("global managed transactions", () => {
  it("plans only changed targets and puts the manifest last", async () => {
    const home = await temporaryUserHome();
    await writeFile(join(home, "a.md"), "old");
    const changed: TargetState = {
      relativePath: "a.md",
      absolutePath: join(home, "a.md"),
      original: "old",
      current: "new",
    };
    const same: TargetState = {
      relativePath: "b.md",
      absolutePath: join(home, "b.md"),
      original: undefined,
      current: undefined,
    };

    const plans = await buildPlans(
      new Map([
        ["a.md", changed],
        ["b.md", same],
      ]),
      join(home, "managed.json"),
      "{}\n",
      "managed.json",
      undefined,
    );

    expect(plans.map((plan) => plan.label)).toEqual(["a.md", "managed.json"]);
  });

  it("rolls back earlier writes when a later write fails", async () => {
    const home = await temporaryUserHome();
    const first = join(home, "first.md");
    const second = join(home, "second.md");
    await writeFile(first, "one");
    await writeFile(second, "two");
    const plans = [
      { path: first, label: "first.md", output: "ONE", snapshot: await captureSnapshot(first) },
      { path: second, label: "second.md", output: "TWO", snapshot: await captureSnapshot(second) },
    ];
    const writer = async (path: string, content: string): Promise<void> => {
      if (path === second) throw new Error("disk full");
      await writeFile(path, content);
    };

    await expect(applyPlans(plans, writer, () => Promise.resolve())).rejects.toBeInstanceOf(
      GlobalManagedTransactionError,
    );

    expect(await readFile(first, "utf8")).toBe("one");
    expect(await readFile(second, "utf8")).toBe("two");
  });

  it("refuses to apply when a target changed after planning", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "a.md");
    await writeFile(path, "one");
    const plan = { path, label: "a.md", output: "ONE", snapshot: await captureSnapshot(path) };
    await writeFile(path, "changed by someone else");

    await expect(applyPlans([plan], writeFile, () => Promise.resolve())).rejects.toBeInstanceOf(
      GlobalManagedTransactionError,
    );
    expect(await readFile(path, "utf8")).toBe("changed by someone else");
  });
});
