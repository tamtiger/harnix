import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  findInitializedProject,
  listInitializedChildren,
  requireInitializedProject,
} from "src/utils/project-discovery.js";
import { snapshotTree } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

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

    await expect(findInitializedProject({ cwd: ordinary, workspacePaths: [initialized] })).resolves.toMatchObject({
      kind: "ready",
      root: initialized,
    });
  });

  it("should_deduplicate_realpath_equivalent_workspace_roots", async () => {
    const root = await fixture();
    const initialized = join(root, "workspace");
    const alias = join(root, "workspace-alias");
    await initialize(initialized);
    await symlink(initialized, alias, process.platform === "win32" ? "junction" : "dir");

    await expect(findInitializedProject({ workspacePaths: [initialized, alias] })).resolves.toMatchObject({
      kind: "ready",
      root: initialized,
    });
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

describe("initialized children listing", () => {
  it("should_list_only_initialized_first_level_directories_in_code_unit_order", async () => {
    const root = await fixture();
    await initialize(join(root, "zeta"));
    await initialize(join(root, "alpha"));
    await initialize(join(root, ".hidden"));
    await initialize(join(root, "node_modules"));
    await mkdir(join(root, "plain"), { recursive: true });
    await initialize(join(root, "plain", "deep"));

    await expect(listInitializedChildren(root)).resolves.toEqual(["alpha", "zeta"]);
  });

  it("should_stop_at_the_requested_limit_and_return_nothing_for_a_missing_directory", async () => {
    const root = await fixture();
    for (const name of ["a", "b", "c"]) await initialize(join(root, name));

    await expect(listInitializedChildren(root, 2)).resolves.toEqual(["a", "b"]);
    await expect(listInitializedChildren(join(root, "missing"))).resolves.toEqual([]);
  });

  it("should_skip_a_child_that_is_a_symbolic_link", async () => {
    const root = await fixture();
    const outside = await fixture();
    await initialize(outside);
    await symlink(outside, join(root, "linked"), process.platform === "win32" ? "junction" : "dir");

    await expect(listInitializedChildren(root)).resolves.toEqual([]);
  });
});

describe("required initialized project", () => {
  it("should_return_the_nearest_ancestor_for_a_nested_repository_directory", async () => {
    const root = await fixture();
    const nested = join(root, "services", "api", "src");
    await initialize(root);
    await mkdir(nested, { recursive: true });

    await expect(requireInitializedProject(nested)).resolves.toBe(root);
  });

  it("should_explain_a_missing_project_and_name_initialized_children_without_absolute_paths", async () => {
    const root = await fixture();
    await initialize(join(root, "billing"));
    await initialize(join(root, "ledger"));
    const before = await snapshotTree(root);

    const caught: unknown = await requireInitializedProject(root).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(caught).toBeInstanceOf(Error);
    const { message } = caught as Error;
    expect(message).toContain("No initialized Harnix project found from the current directory.");
    expect(message).toContain("billing, ledger");
    expect(message).not.toContain(root);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("should_not_mention_children_when_none_are_initialized", async () => {
    const root = await fixture();
    await mkdir(join(root, "plain"), { recursive: true });

    await expect(requireInitializedProject(root)).rejects.toThrow(
      /^No initialized Harnix project found from the current directory\.$/u,
    );
  });

  it("should_report_an_invalid_state_when_the_harnix_directory_escapes_through_a_link", async () => {
    const root = await fixture();
    const outside = await fixture();
    await initialize(outside);
    await symlink(join(outside, ".harnix"), join(root, ".harnix"), process.platform === "win32" ? "junction" : "dir");

    await expect(requireInitializedProject(root)).rejects.toThrow(/invalid/iu);
  });
});

describe("initialized children hint hygiene", () => {
  it("offers only names made of letters, digits, spaces, dots, dashes and underscores", async () => {
    const root = await fixture();
    await initialize(join(root, "ok-svc"));
    await initialize(join(root, "Dịch vụ 2"));
    await initialize(join(root, "weird;name"));
    await initialize(join(root, "x".repeat(65)));

    await expect(listInitializedChildren(root)).resolves.toEqual(["Dịch vụ 2", "ok-svc"]);
  });
});
