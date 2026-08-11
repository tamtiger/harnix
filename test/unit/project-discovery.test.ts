import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { findInitializedProject } from "../../src/utils/project-discovery.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const fixture = useTemporaryRepositories("harnix-project-discovery-");

async function initialize(root: string): Promise<void> {
  await mkdir(join(root, ".harnix"), { recursive: true });
  await writeFile(join(root, ".harnix", "config.yaml"), "generator: harnix\nschemaVersion: 1\n");
}

describe("initialized project discovery", () => {
  it("should_select_the_nearest_initialized_root_from_a_nested_non_git_directory", async () => {
    const root = await fixture();
    const nested = join(root, "packages", "service");
    const child = join(nested, "src", "feature");
    await initialize(root);
    await initialize(nested);
    await mkdir(child, { recursive: true });

    await expect(findInitializedProject({ cwd: child })).resolves.toMatchObject({ kind: "ready", root: nested });
  });

  it("should_fall_back_to_the_single_initialized_workspace_when_cwd_is_not_initialized", async () => {
    const root = await fixture();
    const initialized = join(root, "workspace-a");
    const ordinary = join(root, "workspace-b");
    await initialize(initialized);
    await mkdir(ordinary, { recursive: true });

    await expect(findInitializedProject({ cwd: ordinary, workspacePaths: [initialized] })).resolves.toMatchObject({ kind: "ready", root: initialized });
  });

  it("should_deduplicate_realpath_equivalent_workspace_roots", async () => {
    const root = await fixture();
    const initialized = join(root, "workspace");
    const alias = join(root, "workspace-alias");
    await initialize(initialized);
    await symlink(initialized, alias, process.platform === "win32" ? "junction" : "dir");

    await expect(findInitializedProject({ workspacePaths: [initialized, alias] })).resolves.toMatchObject({ kind: "ready", root: initialized });
  });

  it("should_fail_closed_when_multiple_workspace_roots_are_initialized_without_an_active_cwd", async () => {
    const root = await fixture();
    const first = join(root, "workspace-a");
    const second = join(root, "workspace-b");
    await initialize(first);
    await initialize(second);

    await expect(findInitializedProject({ workspacePaths: [first, second] })).resolves.toEqual({ kind: "ambiguous" });
  });
});
