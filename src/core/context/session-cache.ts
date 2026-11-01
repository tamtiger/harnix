import { mkdir, readFile, readdir, rm, stat, utimes } from "node:fs/promises";
import { join } from "node:path";

import { atomicWriteFile } from "src/utils/atomic-write.js";
import { sha256 } from "src/utils/hashing.js";

/** At most this many session slots stay under `tmp/context-cache/`; the oldest ones are removed first. */
export const MAX_SESSION_SLOTS = 16;

const CACHE_DIRECTORY = "context-cache";
const SLOT_NAME = /^[0-9a-f]{32}\.json$/u;

/**
 * Decides whether this session already received `payloadHash` and records it. One file per session
 * (named by a hash of the host-supplied id, never the id itself) so interleaved sessions on one
 * repository cannot overwrite each other. Every failure is a cache miss: the hook must never fail on it.
 */
export async function shouldElideContext(
  tmpDirectory: string,
  sessionId: string,
  payloadHash: string,
): Promise<boolean> {
  const directory = join(tmpDirectory, CACHE_DIRECTORY);
  const slot = join(directory, `${sha256(sessionId).slice(0, 32)}.json`);
  try {
    const previous = JSON.parse(await readFile(slot, "utf8")) as { payloadHash?: unknown };
    if (previous.payloadHash === payloadHash) {
      await touch(slot);
      return true;
    }
  } catch {
    // Missing or corrupt slot: cache miss.
  }
  try {
    await mkdir(directory, { recursive: true });
    await atomicWriteFile(slot, JSON.stringify({ payloadHash }));
    await pruneSlots(directory);
  } catch {
    // Best-effort.
  }
  return false;
}

/** A hit refreshes the slot time so pruning by age drops idle sessions first (LRU); a failure changes nothing. */
async function touch(slot: string): Promise<void> {
  try {
    const now = new Date();
    await utimes(slot, now, now);
  } catch {
    // Best-effort.
  }
}

async function pruneSlots(directory: string): Promise<void> {
  const names = (await readdir(directory)).filter((name) => SLOT_NAME.test(name));
  if (names.length <= MAX_SESSION_SLOTS) return;
  const aged = await Promise.all(
    names.map(async (name) => ({
      name,
      time: (await stat(join(directory, name)).catch(() => undefined))?.mtimeMs ?? 0,
    })),
  );
  aged.sort((a, b) => a.time - b.time || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const { name } of aged.slice(0, aged.length - MAX_SESSION_SLOTS)) {
    await rm(join(directory, name), { force: true });
  }
}
