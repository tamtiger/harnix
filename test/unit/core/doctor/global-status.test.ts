import { describe, expect, it } from "vitest";

import { finalizeInspection, safeCommandLookup } from "src/core/doctor/global-status.js";
import type { PlatformInspection } from "src/core/doctor/global-inspect.js";
import { finding } from "src/core/doctor/findings.js";
import type { GlobalDoctorPlatform } from "src/core/doctor/global-types.js";

const healthy = (
  platform: GlobalDoctorPlatform,
  findings = [] as PlatformInspection["findings"],
): PlatformInspection => ({
  platform,
  state: "healthy",
  findings,
});

describe("global integration status", () => {
  it("passes through states that are not healthy", async () => {
    for (const state of ["not-installed", "invalid", "drifted"] as const) {
      const result = await finalizeInspection({ platform: "kiro", state, findings: [] }, true, undefined, undefined);
      expect(result.status).toBe(state);
    }
  });

  it("reports an unavailable launcher and an unsupported version before anything else", async () => {
    expect((await finalizeInspection(healthy("claude"), false, undefined, undefined)).status).toBe(
      "binary-unavailable",
    );
    const unsupported = await finalizeInspection(healthy("claude"), true, undefined, () =>
      Promise.resolve("unsupported-version"),
    );
    expect(unsupported.status).toBe("unsupported-version");
    expect(unsupported.findings.map((item) => item.code)).toContain("global-unsupported-version");
  });

  it("stays installed for a platform whose healthy readiness is installed", async () => {
    expect((await finalizeInspection(healthy("claude"), true, undefined, undefined)).status).toBe("installed");
    const active = await finalizeInspection(healthy("kiro"), true, undefined, () => Promise.resolve("active"));
    expect(active.status).toBe("active");
    expect(active.findings.map((item) => item.code)).toContain("global-integration-active");
  });

  it("keeps a precedence-unknown platform unknown until external evidence says more", async () => {
    const unknown = await finalizeInspection(healthy("antigravity"), true, undefined, undefined);
    expect(unknown.status).toBe("precedence-unknown");
    expect(unknown.findings.map((item) => item.code)).toContain("antigravity-precedence-unknown");

    const shadowed = await finalizeInspection(healthy("antigravity"), true, undefined, () =>
      Promise.resolve("shadowed"),
    );
    expect(shadowed.status).toBe("shadowed");
  });

  it("keeps a trust-gated platform pending until the trust lookup confirms the hook", async () => {
    expect((await finalizeInspection(healthy("codex"), true, undefined, undefined)).status).toBe(
      "installed-pending-trust",
    );
    expect(
      (await finalizeInspection(healthy("codex"), true, () => Promise.resolve("untrusted"), undefined)).status,
    ).toBe("installed-pending-trust");
    expect(
      (await finalizeInspection(healthy("codex"), true, () => Promise.reject(new Error("x")), undefined)).status,
    ).toBe("installed-pending-trust");

    const trusted = await finalizeInspection(healthy("codex"), true, () => Promise.resolve("trusted"), undefined);
    expect(trusted.status).toBe("installed");
    expect(trusted.findings.map((item) => item.code)).toContain("codex-trust-evidence");
  });

  it("reports a shadowing file as shadowed before consulting trust", async () => {
    const shadow = finding("codex-agents-override-shadowed", "warning", undefined, "m", false);

    const result = await finalizeInspection(
      healthy("codex", [shadow]),
      true,
      () => Promise.resolve("trusted"),
      undefined,
    );

    expect(result.status).toBe("shadowed");
  });

  it("treats a failing command lookup as an unavailable launcher", async () => {
    expect(await safeCommandLookup(() => Promise.reject(new Error("x")))).toBe(false);
    expect(await safeCommandLookup(() => Promise.resolve(true))).toBe(true);
  });
});
