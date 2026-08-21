import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CODEX_GLOBAL_AGENTS_SELECTOR,
  CODEX_GLOBAL_HOOK_SELECTOR,
  createCodexGlobalSurfacePlan,
  matchesCodexGlobalContextHookGroup,
} from "../../src/configurators/codex.js";
import { reconcileGlobalManagedFiles } from "../../src/utils/global-managed-files.js";
import { resolveUserPlatformRoots } from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-codex-global-");

describe("Codex global surface plan", () => {
  it("uses one inline config source when Codex has its hook trust state", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });
    await mkdir(roots.codex.config.path, { recursive: true });
    await writeFile(join(roots.codex.config.path, "config.toml"), "[features]\nhooks = true\n\n[hooks.state]\n");
    const plan = createCodexGlobalSurfacePlan();

    await reconcileGlobalManagedFiles({
      desired: plan.config,
      generatorVersion: "0.6.0",
      manifestPath: "harnix/managed.json",
      platform: "codex",
      root: roots.codex.config,
    });

    const config = await readFile(join(roots.codex.config.path, "config.toml"), "utf8");
    expect(config).toContain("# harnix:codex-hook:begin");
    expect(config).toContain("[[hooks.UserPromptSubmit]]");
    await expect(access(join(roots.codex.config.path, "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("renders only root-relative global skills plus conditional AGENTS and the current nested hook shape", () => {
    const plan = createCodexGlobalSurfacePlan();

    expect(plan.skills).toHaveLength(7);
    expect(plan.skills.every((file) => file.kind === "file" && /^skills\/harnix-[a-z-]+\/SKILL\.md$/u.test(file.path))).toBe(true);
    expect(plan.skills.every((file) => file.path.startsWith(".") === false)).toBe(true);
    expect(plan.skills.every((file) => file.kind !== "file" || file.content.includes(".harnix/config.yaml"))).toBe(true);
    expect(plan.config.map((file) => file.path)).toEqual(["AGENTS.md", "config.toml"]);

    const agents = plan.config.find((file) => file.path === "AGENTS.md");
    expect(agents).toMatchObject({
      kind: "managed-block",
      selector: CODEX_GLOBAL_AGENTS_SELECTOR,
      sourceId: "codex-global-agents",
    });
    if (agents?.kind !== "managed-block") throw new Error("Expected AGENTS.md to be a managed block.");
    expect(agents.content).toContain("nearest ancestor or workspace root containing `.harnix/config.yaml`");
    expect(agents.content).toContain("no such root exists or its state is invalid");
    expect(agents.content).not.toContain("<!-- harnix:begin -->");

    const hook = plan.config.find((file) => file.path === "config.toml");
    expect(hook).toMatchObject({
      kind: "managed-block",
      selector: { type: "markers", begin: "# harnix:codex-hook:begin", end: "# harnix:codex-hook:end" },
      sourceId: "codex-global-context-hook",
      content: expect.stringContaining("[[hooks.UserPromptSubmit]]"),
    });
    if (hook?.kind !== "managed-block") throw new Error("Expected config.toml to contain a managed TOML block.");
    expect(hook.content).not.toContain("harnix.exe");
    expect(JSON.stringify(plan)).not.toContain(process.cwd());
    expect(JSON.stringify(plan)).not.toMatch(/[A-Za-z]:\\\\/u);
    expect(JSON.stringify(plan)).not.toContain("/home/");
    expect(JSON.stringify(plan)).not.toContain(".codex/");
    expect(JSON.stringify(plan)).not.toContain(".agents/");
  });

  it("uses selectors and a structural matcher that preserve unrelated AGENTS text and UserPromptSubmit groups", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });
    await mkdir(roots.codex.config.path, { recursive: true });
    await writeFile(join(roots.codex.config.path, "AGENTS.md"), "# User instructions\n\nPreserve this text.\n");
    await writeFile(join(roots.codex.config.path, "config.toml"), "[hooks.state]\nuser = true\n");
    const plan = createCodexGlobalSurfacePlan();

    await reconcileGlobalManagedFiles({
      desired: plan.config,
      generatorVersion: "0.6.0",
      manifestPath: "harnix/managed.json",
      platform: "codex",
      root: roots.codex.config,
    });

    await expect(readFile(join(roots.codex.config.path, "AGENTS.md"), "utf8")).resolves.toContain("# User instructions\n\nPreserve this text.");
    await expect(readFile(join(roots.codex.config.path, "AGENTS.md"), "utf8")).resolves.toContain(CODEX_GLOBAL_AGENTS_SELECTOR.begin);
    const config = await readFile(join(roots.codex.config.path, "config.toml"), "utf8");
    expect(config).toContain("[hooks.state]\nuser = true");
    expect(config).toContain("[[hooks.UserPromptSubmit]]");

    expect(matchesCodexGlobalContextHookGroup({ hooks: [{ type: "command", command: "user-edited-command", timeout: 99, additionalContextLimit: 2500 }] }, CODEX_GLOBAL_HOOK_SELECTOR)).toBe(true);
    expect(matchesCodexGlobalContextHookGroup({ hooks: [{ type: "command", command: "user-context" }] }, CODEX_GLOBAL_HOOK_SELECTOR)).toBe(false);
  });
});
