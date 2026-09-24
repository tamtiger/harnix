export const defaultMaximumInputBytes = 65_536;

const idleTimeout = Symbol("readBoundedInput idle timeout");

/**
 * Reads a bounded byte count from an async source. When `idleTimeoutMs` is
 * given, the read also stops and returns whatever was collected so far if no
 * new chunk arrives within that window — this protects a caller (such as the
 * Claude Code UserPromptSubmit hook) from hanging forever when the writer
 * never closes the stream. Omitting `idleTimeoutMs` preserves the original
 * unbounded-wait behavior relied on by `workflow --save`/`--evidence`.
 */
export async function readBoundedInput(
  input: AsyncIterable<unknown>,
  maximumBytes = defaultMaximumInputBytes,
  idleTimeoutMs?: number,
): Promise<string | undefined> {
  if (!Number.isInteger(maximumBytes) || maximumBytes <= 0) {
    throw new Error("Maximum input bytes must be a positive integer.");
  }
  const chunks: Buffer[] = [];
  let length = 0;
  const iterator = input[Symbol.asyncIterator]();
  while (true) {
    const step = await raceWithIdleTimeout(iterator.next(), idleTimeoutMs);
    if (step === idleTimeout) {
      abandon(input, iterator);
      break;
    }
    if (step.done) break;
    const buffer = Buffer.isBuffer(step.value) ? step.value : Buffer.from(String(step.value));
    length += buffer.length;
    if (length > maximumBytes) {
      abandon(input, iterator);
      return undefined;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Releases a source we're giving up on early. Calling and awaiting
 * `iterator.return()` can hang just as long as the read did, since a
 * generator can only honor it once its own pending await settles; a real
 * stream (like `process.stdin`) instead exposes `destroy()`, which drops its
 * underlying handle immediately so it stops keeping the process alive.
 */
function abandon(input: AsyncIterable<unknown>, iterator: AsyncIterator<unknown>): void {
  const destroyable = input as { destroy?: () => void };
  if (typeof destroyable.destroy === "function") destroyable.destroy();
  else void iterator.return?.()?.catch(() => undefined);
}

async function raceWithIdleTimeout<T>(pending: Promise<T>, idleTimeoutMs: number | undefined): Promise<T | typeof idleTimeout> {
  if (idleTimeoutMs === undefined) return pending;
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<typeof idleTimeout>((resolve) => {
    timer = setTimeout(() => resolve(idleTimeout), idleTimeoutMs);
  });
  try {
    return await Promise.race([pending, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}
