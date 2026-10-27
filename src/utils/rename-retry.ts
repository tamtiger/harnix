import { rename } from "node:fs/promises";

export type MoveFunction = (source: string, destination: string) => Promise<void>;

const RETRY_DELAYS_MS = [10, 25, 50, 100, 200, 400] as const;
const TRANSIENT_CODES = new Set(["EPERM", "EBUSY", "EACCES"]);

export function errorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
}

/** Renames with a short bounded retry: Windows can refuse a directory rename while a scanner holds a file in it. */
export async function renameWithRetry(source: string, destination: string, move: MoveFunction = rename): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await move(source, destination);
      return;
    } catch (error: unknown) {
      const code = errorCode(error);
      if (code === undefined || !TRANSIENT_CODES.has(code) || attempt >= RETRY_DELAYS_MS.length) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}
