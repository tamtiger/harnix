import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createConfig, writeConfig } from "../../src/core/config/config.js";
import { setupPlatforms } from "../../src/commands/setup.js";

const temporaryDirectories: string[] = [];

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "harnix-platform-"));
  temporaryDirectories.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe("setupPlatforms", () => {
  it("writes byte-idempotent Kiro and Codex project surfaces while preserving user-owned Codex data", async () => {
    const root = await fixture();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam", languages: ["vue"] }));
    await writeFile(join(root, "AGENTS.md"), "# User guide\n\nKeep this text.\n");
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex", "hooks.json"), JSON.stringify({ hooks: { UserPromptSubmit: [{ command: "user-command" }] } }));

    await setupPlatforms({ platforms: ["kiro", "codex"], root });
    const firstAgents = await readFile(join(root, "AGENTS.md"), "utf8");
    await setupPlatforms({ platforms: ["kiro", "codex"], root });

    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(firstAgents);
    expect(firstAgents).toContain("Keep this text.");
    expect(firstAgents).toContain("<!-- harnix:begin -->");
    await expect(readFile(join(root, ".kiro", "hooks", "harnix-context.kiro.hook"), "utf8")).resolves.toContain('"promptSubmit"');
    await expect(readFile(join(root, ".kiro", "steering", "harnix.md"), "utf8")).resolves.toContain("Harnix");
    await expect(readFile(join(root, ".agents", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain("name: harnix-implement");
    const hooks = JSON.parse(await readFile(join(root, ".codex", "hooks.json"), "utf8")) as { hooks: { UserPromptSubmit: Array<{ command: string }> } };
    expect(hooks.hooks.UserPromptSubmit.map((hook) => hook.command)).toEqual(["user-command", "harnix internal context --platform codex"]);
  });

  it("recognizes antigravity but does not write an unverified v1 hook/settings surface", async () => {
    const root = await fixture();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));

    const result = await setupPlatforms({ platforms: ["antigravity"], root });

    expect(result.skipped).toEqual(["antigravity"]);
  });
});