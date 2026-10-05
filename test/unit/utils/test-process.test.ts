import { afterEach, describe, expect, it, vi } from "vitest";

import { isTestProcess } from "src/utils/test-process.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isTestProcess", () => {
  it("is true only when the test runner marks the process", () => {
    vi.stubEnv("VITEST", "true");

    expect(isTestProcess()).toBe(true);
  });

  it("ignores NODE_ENV=test that a user's shell or CI may set for an ordinary harnix run", () => {
    vi.stubEnv("VITEST", undefined);
    vi.stubEnv("NODE_ENV", "test");

    expect(isTestProcess()).toBe(false);
  });
});
