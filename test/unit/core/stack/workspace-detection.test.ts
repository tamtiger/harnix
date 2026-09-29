import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { detectWorkspaces } from "src/core/stack/workspace-detection.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-workspace-detect-");

async function writeFixture(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("detectWorkspaces (ac-workspace: nearest-manifest-wins monorepo)", () => {
  it("detects pnpm workspace packages and generates per-package verify commands", async () => {
    const root = await createFixture();
    await writeFixture(root, "pnpm-workspace.yaml", "packages:\n  - 'packages/*'\n  - 'apps/*'\n");
    await writeFixture(root, "pnpm-lock.yaml", "");
    await writeFixture(
      root,
      "packages/core/package.json",
      JSON.stringify({
        name: "@demo/core",
        scripts: { test: "vitest run", lint: "eslint ." },
      }),
    );
    await writeFixture(
      root,
      "apps/web/package.json",
      JSON.stringify({
        name: "@demo/web",
        scripts: { test: "playwright test", typecheck: "tsc" },
      }),
    );

    const workspaces = await detectWorkspaces(root);
    expect(workspaces.map((w) => w.path).sort()).toEqual(["apps/web", "packages/core"]);

    const core = workspaces.find((w) => w.path === "packages/core");
    expect(core?.ecosystem).toBe("node");
    expect(core?.commands.test).toBe("pnpm run test");
    expect(core?.commands.lint).toBe("pnpm run lint");

    const web = workspaces.find((w) => w.path === "apps/web");
    expect(web?.commands.test).toBe("pnpm run test");
    expect(web?.commands.typecheck).toBe("pnpm run typecheck");
  });

  it("detects Cargo workspace members", async () => {
    const root = await createFixture();
    await writeFixture(root, "Cargo.toml", '[workspace]\nmembers = [\n    "crates/core",\n    "crates/cli",\n]\n');
    await writeFixture(root, "crates/core/Cargo.toml", '[package]\nname = "core"\nversion = "0.1.0"\n');
    await writeFixture(root, "crates/cli/Cargo.toml", '[package]\nname = "cli"\nversion = "0.1.0"\n');

    const workspaces = await detectWorkspaces(root);
    expect(workspaces.map((w) => w.path).sort()).toEqual(["crates/cli", "crates/core"]);
    const core = workspaces.find((w) => w.path === "crates/core");
    expect(core?.ecosystem).toBe("rust");
    expect(core?.commands.test).toBe("cargo test");
  });

  it("detects Go multi-module workspaces (go.work)", async () => {
    const root = await createFixture();
    await writeFixture(root, "go.work", "go 1.22\n\nuse (\n\t./services/auth\n\t./services/billing\n)\n");
    await writeFixture(root, "services/auth/go.mod", "module auth\ngo 1.22\n");
    await writeFixture(root, "services/billing/go.mod", "module billing\ngo 1.22\n");

    const workspaces = await detectWorkspaces(root);
    expect(workspaces.map((w) => w.path).sort()).toEqual(["services/auth", "services/billing"]);
    const auth = workspaces.find((w) => w.path === "services/auth");
    expect(auth?.ecosystem).toBe("go");
    expect(auth?.commands.test).toBe("go test ./...");
  });

  it("detects Maven multi-module projects", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "pom.xml",
      "<project><modules><module>server</module><module>client</module></modules></project>\n",
    );
    await writeFixture(root, "server/pom.xml", "<project />\n");
    await writeFixture(root, "client/pom.xml", "<project />\n");

    const workspaces = await detectWorkspaces(root);
    expect(workspaces.map((w) => w.path).sort()).toEqual(["client", "server"]);
    const server = workspaces.find((w) => w.path === "server");
    expect(server?.ecosystem).toBe("maven");
    expect(server?.commands.test).toBe("mvn test");
  });

  it("applies nearest-manifest-wins for nested packages", async () => {
    const root = await createFixture();
    await writeFixture(root, "package.json", JSON.stringify({ name: "root", scripts: { test: "echo root" } }));
    await writeFixture(root, "services/api/package.json", JSON.stringify({ name: "api", scripts: { test: "jest" } }));
    await writeFixture(
      root,
      "services/api/src/nested/package.json",
      JSON.stringify({ name: "nested", scripts: { test: "mocha" } }),
    );

    const workspaces = await detectWorkspaces(root);
    const api = workspaces.find((w) => w.path === "services/api");
    const nested = workspaces.find((w) => w.path === "services/api/src/nested");
    expect(api).toBeDefined();
    expect(nested).toBeDefined();
  });

  it("detects npm workspaces with object shape { workspaces: { packages: [...] } }", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        workspaces: {
          packages: ["libs/*"],
        },
      }),
    );
    await writeFixture(root, "libs/util/package.json", JSON.stringify({ scripts: { test: "jest" } }));

    const workspaces = await detectWorkspaces(root);
    expect(workspaces.map((w) => w.path)).toEqual(["libs/util"]);
  });

  it("discovers nested manifests when no root workspace config exists", async () => {
    const root = await createFixture();
    await writeFixture(root, "subproject/Cargo.toml", '[package]\nname = "sub"\nversion = "0.1.0"\n');
    await writeFixture(root, "gosub/go.mod", "module gosub\ngo 1.22\n");

    const workspaces = await detectWorkspaces(root);
    expect(workspaces.map((w) => w.path).sort()).toEqual(["gosub", "subproject"]);
  });
});
