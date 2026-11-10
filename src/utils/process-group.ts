const FORWARDED_SIGNALS = ["SIGINT", "SIGTERM"] as const;

/**
 * A detached child no longer receives the terminal's Ctrl-C with Harnix, so an interrupt of Harnix would leave its
 * check running. While the child lives, SIGINT and SIGTERM end its whole process group and then repeat the signal
 * on this process so it exits as it would have. The returned function removes the handlers.
 */
export function forwardInterruptsToGroup(pid: number): () => void {
  const handlers = FORWARDED_SIGNALS.map((signal) => {
    const handler = (): void => {
      try {
        process.kill(-pid, "SIGKILL");
      } catch {
        /* the group is already gone */
      }
      dispose();
      process.kill(process.pid, signal);
    };
    process.once(signal, handler);
    return { signal, handler };
  });
  const dispose = (): void => {
    for (const { signal, handler } of handlers) process.removeListener(signal, handler);
  };
  return dispose;
}
