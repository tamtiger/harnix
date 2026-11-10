import { rename } from "node:fs/promises";
import { errorCode } from "src/utils/errno.js";

export type MoveFunction = (source: string, destination: string) => Promise<void>;

const RETRY_DELAYS_MS = [10, 25, 50, 100, 200, 400] as const;
const TRANSIENT_CODES = new Set(["EPERM", "EBUSY", "EACCES"]);

/** Renames with a short bounded retry: Windows can refuse a directory rename while a scanner holds a file in it. */
export async function renameWithRetry(
  source: string,
  destination: string,
  move: MoveFunction = rename,
  retryDelaysMs: readonly number[] = RETRY_DELAYS_MS,
): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await move(source, destination);
      return;
    } catch (error: unknown) {
      const code = errorCode(error);
      if (code === undefined || !TRANSIENT_CODES.has(code) || attempt >= retryDelaysMs.length) throw error;
      const delayMs = retryDelaysMs[attempt]!;
      if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
