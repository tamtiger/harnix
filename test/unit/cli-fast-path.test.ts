import { describe, expect, it } from "vitest";

import { canonicalInternalContextPlatform } from "../../src/cli.js";

describe("CLI internal-context fast path", () => {
  it("should_select_only_the_canonical_hook_command_shape", () => {
    expect(canonicalInternalContextPlatform(["node", "harnix", "internal", "context", "--platform", "antigravity"])).toBe("antigravity");
    expect(canonicalInternalContextPlatform(["node", "harnix", "internal", "context", "--platform", "kiro"])).toBe("kiro");
    expect(canonicalInternalContextPlatform(["node", "harnix", "internal", "context", "--platform", "codex"])).toBe("codex");
  });

  it("should_keep_noncanonical_or_invalid_commands_on_the_regular_cli_path", () => {
    expect(canonicalInternalContextPlatform(["node", "harnix", "internal", "context", "--platform=antigravity"])).toBeUndefined();
    expect(canonicalInternalContextPlatform(["node", "harnix", "internal", "context", "--platform", "unknown"])).toBeUndefined();
    expect(canonicalInternalContextPlatform(["node", "harnix", "internal", "context", "--platform", "antigravity", "--extra"])).toBeUndefined();
  });
});
