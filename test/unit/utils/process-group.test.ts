import { afterEach, describe, expect, it, vi } from "vitest";

import { forwardInterruptsToGroup } from "src/utils/process-group.js";

describe("process group interrupt forwarding", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds one SIGINT and one SIGTERM handler and removes both on dispose", () => {
    const before = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")];
    const dispose = forwardInterruptsToGroup(4242);
    expect([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")]).toEqual([
      before[0]! + 1,
      before[1]! + 1,
    ]);
    dispose();
    expect([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")]).toEqual(before);
  });

  it("kills the child's group and repeats the signal on this process when an interrupt arrives", () => {
    const kill = vi.spyOn(process, "kill").mockImplementation(() => true);
    const listenersBefore = process.listenerCount("SIGTERM");
    const dispose = forwardInterruptsToGroup(4242);
    process.emit("SIGTERM", "SIGTERM");
    expect(kill.mock.calls).toEqual([
      [-4242, "SIGKILL"],
      [process.pid, "SIGTERM"],
    ]);
    dispose();
    expect(process.listenerCount("SIGTERM")).toBe(listenersBefore);
  });
});
