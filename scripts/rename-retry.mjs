import { rename } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const TRANSIENT_CODES = new Set(["EPERM", "EBUSY", "EACCES"]);

/** Windows can refuse a rename for a moment while a scanner or another process holds the file; retry briefly. */
export async function renameWithRetry(source, destination, attempts = 6) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await rename(source, destination);
      return;
    } catch (error) {
      if (!TRANSIENT_CODES.has(error?.code) || attempt >= attempts) throw error;
      await sleep(25 * (attempt + 1));
    }
  }
}
