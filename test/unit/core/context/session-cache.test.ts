import { readdir, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MAX_SESSION_SLOTS, shouldElideContext } from "src/core/context/session-cache.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function slotNames(directory: string): Promise<string[]> {
  return (await readdir(join(directory, "context-cache"))).filter((name) => name.endsWith(".json"));
}

describe("shouldElideContext", () => {
  it("injects the first time and elides the same hash for the same session", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    expect(await shouldElideContext(tmp, "sess-a", "h1")).toBe(false);
    expect(await shouldElideContext(tmp, "sess-a", "h1")).toBe(true);
  });

  it("injects again when the payload hash changes for that session", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    await shouldElideContext(tmp, "sess-a", "h1");
    expect(await shouldElideContext(tmp, "sess-a", "h2")).toBe(false);
    expect(await shouldElideContext(tmp, "sess-a", "h2")).toBe(true);
  });

  it("keeps sessions independent when they interleave (A, B, A, B)", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    expect(await shouldElideContext(tmp, "A", "h")).toBe(false);
    expect(await shouldElideContext(tmp, "B", "h")).toBe(false);
    expect(await shouldElideContext(tmp, "A", "h")).toBe(true);
    expect(await shouldElideContext(tmp, "B", "h")).toBe(true);
  });

  it("survives concurrent first writes from different sessions", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    await Promise.all(["A", "B", "C", "D"].map((id) => shouldElideContext(tmp, id, "h")));
    for (const id of ["A", "B", "C", "D"]) expect(await shouldElideContext(tmp, id, "h")).toBe(true);
  });

  it("never turns the session id into a path and caps the number of slots", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    await shouldElideContext(tmp, "../../evil/..\\x", "h");
    for (let index = 0; index < MAX_SESSION_SLOTS + 5; index += 1) {
      await shouldElideContext(tmp, `session-${index}`, "h");
    }
    const names = await slotNames(tmp);
    expect(names.length).toBeLessThanOrEqual(MAX_SESSION_SLOTS);
    for (const name of names) expect(name).toMatch(/^[0-9a-f]{32}\.json$/u);
  });

  it("removes the oldest slot first and treats a corrupt slot as a miss", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    await shouldElideContext(tmp, "old", "h");
    const [oldName] = await slotNames(tmp);
    const past = new Date(Date.now() - 3_600_000);
    await utimes(join(tmp, "context-cache", oldName!), past, past);
    for (let index = 0; index < MAX_SESSION_SLOTS; index += 1) await shouldElideContext(tmp, `s-${index}`, "h");
    expect(await slotNames(tmp)).not.toContain(oldName);
  });

  it("refreshes the slot time on a hit so a long-running session is pruned last", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    await shouldElideContext(tmp, "busy", "h");
    const [busyName] = await slotNames(tmp);
    const slot = join(tmp, "context-cache", busyName!);
    const past = new Date(Date.now() - 3_600_000);
    await utimes(slot, past, past);
    const recent = new Date(Date.now() - 1_800_000);
    for (let index = 0; index < MAX_SESSION_SLOTS - 1; index += 1) {
      await shouldElideContext(tmp, `n-${index}`, "h");
    }
    for (const name of await slotNames(tmp))
      if (name !== busyName) await utimes(join(tmp, "context-cache", name), recent, recent);

    expect(await shouldElideContext(tmp, "busy", "h")).toBe(true);
    expect((await stat(slot)).mtimeMs).toBeGreaterThan(past.getTime() + 60_000);

    await shouldElideContext(tmp, "newcomer", "h");
    expect(await slotNames(tmp)).toContain(busyName);
    expect(await slotNames(tmp)).toHaveLength(MAX_SESSION_SLOTS);
  });

  it("treats a corrupt slot as a cache miss", async () => {
    const tmp = join(await temporaryRepository(), ".harnix", "tmp");
    await shouldElideContext(tmp, "bad", "h");
    const [name] = await slotNames(tmp);
    await writeFile(join(tmp, "context-cache", name!), "{not json");
    expect(await shouldElideContext(tmp, "bad", "h")).toBe(false);
    expect(await shouldElideContext(tmp, "bad", "h")).toBe(true);
  });
});
