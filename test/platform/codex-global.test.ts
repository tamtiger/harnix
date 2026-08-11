import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CODEX_GLOBAL_AGENTS_SELECTOR,
  CODEX_GLOBAL_HOOK_SELECTOR,
  createCodexGlobalSurfacePlan,
} from "../../src/configurators/codex.js";
import { reconcileGlobalManagedFiles, type DesiredGlobalJsonMember } from "../../src/utils/global-managed-files.js";
import { resolveUserPlatformRoots } from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-codex-global-");

describe("Codex global surface plan", () => {
  it("renders only root-relative global skills plus conditional AGENTS and the current nested hook shape", () => {
    const plan = createCodexGlobalSurfacePlan();

    expect(plan.skills).toHaveLength(7);
    expect(plan.skills.every((file) => file.kind === "file" && /^skills\/harnix-[a-z-]+\/SKILL\.md$/u.test(file.path))).toBe(true);
    expect(plan.skills.every((file) => file.path.startsWith(".") === false)).toBe(true);
    expect(plan.skills.every((file) => file.kind !== "file" || file.content.includes(".harnix/config.yaml"))).toBe(true);
    expect(plan.config.map((file) => file.path)).toEqual(["AGENTS.md", "hooks.json"]);

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

    const hook = plan.config.find((file) => file.path === "hooks.json");
    expect(hook).toMatchObject({
      kind: "json-member",
      selector: CODEX_GLOBAL_HOOK_SELECTOR,
      sourceId: "codex-global-context-hook",
      member: {
        hooks: [{
          type: "command",
          command: "harnix internal context --platform codex",
          timeout: 5,
          additionalContextLimit: 2500,
        }],
      },
    });
    if (hook?.kind !== "json-member") throw new Error("Expected hooks.json to contain a managed JSON member.");
    expect(JSON.stringify(hook.member)).not.toContain("harnix.exe");
    expect(JSON.stringify(plan)).not.toContain(process.cwd());
    expect(JSON.stringify(plan)).not.toMatch(/[A-Za-z]:\\/u);
    expect(JSON.stringify(plan)).not.toContain("/home/");
    expect(JSON.stringify(plan)).not.toContain(".codex/");
    expect(JSON.stringify(plan)).not.toContain(".agents/");
  });

  it("uses selectors and a structural matcher that preserve unrelated AGENTS text and UserPromptSubmit groups", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });
    await mkdir(roots.codex.config.path, { recursive: true });
    await writeFile(join(roots.codex.config.path, "AGENTS.md"), "# User instructions\n\nPreserve this text.\n");
    await writeFile(join(roots.codex.config.path, "hooks.json"), `${JSON.stringify({
      description: "User hooks",
      hooks: {
        UserPromptSubmit: [{ hooks: [{ type: "command", command: "user-context", timeout: 1 }] }],
      },
    }, null, 2)}\n`);
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
    const hooks = JSON.parse(await readFile(join(roots.codex.config.path, "hooks.json"), "utf8")) as { hooks: { UserPromptSubmit: unknown[] } };
    expect(hooks.hooks.UserPromptSubmit).toHaveLength(2);
    expect(hooks.hooks.UserPromptSubmit[0]).toMatchObject({ hooks: [{ command: "user-context" }] });
    expect(hooks.hooks.UserPromptSubmit[1]).toMatchObject({ hooks: [{ command: "harnix internal context --platform codex" }] });

    const hook = plan.config.find((file): file is DesiredGlobalJsonMember => file.kind === "json-member");
    expect(hook?.memberMatcher?.({ hooks: [{ type: "command", command: "user-edited-command", timeout: 99, additionalContextLimit: 2500 }] }, CODEX_GLOBAL_HOOK_SELECTOR)).toBe(true);
    expect(hook?.memberMatcher?.({ hooks: [{ type: "command", command: "user-context" }] }, CODEX_GLOBAL_HOOK_SELECTOR)).toBe(false);
  });
});
