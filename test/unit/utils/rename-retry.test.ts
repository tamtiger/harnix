import { describe, expect, it } from "vitest";
import { errorCode, renameWithRetry } from "src/utils/rename-retry.js";

const failure = (code: string): Error => Object.assign(new Error(code), { code });

describe("renameWithRetry", () => {
  it("retries a transient failure and then succeeds", async () => {
    let calls = 0;
    await renameWithRetry("a", "b", () => (++calls < 3 ? Promise.reject(failure("EPERM")) : Promise.resolve()));
    expect(calls).toBe(3);
  });

  it("does not retry a permanent failure", async () => {
    let calls = 0;
    await expect(
      renameWithRetry("a", "b", () => {
        calls += 1;
        return Promise.reject(failure("ENOENT"));
      }),
    ).rejects.toThrow("ENOENT");
    expect(calls).toBe(1);
  });

  it("gives up after the bounded number of retries", async () => {
    let calls = 0;
    await expect(
      renameWithRetry("a", "b", () => {
        calls += 1;
        return Promise.reject(failure("EBUSY"));
      }),
    ).rejects.toThrow("EBUSY");
    expect(calls).toBe(7);
  });

  it("reads an error code only when it is a string", () => {
    expect(errorCode(failure("EPERM"))).toBe("EPERM");
    expect(errorCode(new Error("x"))).toBeUndefined();
    expect(errorCode(null)).toBeUndefined();
  });
});
