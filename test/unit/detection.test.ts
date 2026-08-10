import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { detectProject } from "../../src/utils/detection.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-detection-");

async function writeFixtureFile(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("detectProject", () => {
  it.each([
    ["C#/.NET ABP", "src/App/App.csproj", '<Project><PackageReference Include="Volo.Abp" /></Project>', "csharp-dotnet-abp"],
    ["NestJS", "package.json", '{"dependencies":{"@nestjs/core":"1"}}', "typescript-nestjs"],
    ["Python", "pyproject.toml", "[project]\nname = 'sample'", "python"],
    ["Java/Spring", "pom.xml", "<project><dependency><artifactId>spring-boot-starter</artifactId></dependency></project>", "java-spring"],
    ["Go", "go.mod", "module example.test/app\ngo 1.22", "go"],
    ["React", "package.json", '{"dependencies":{"react":"1"}}', "react-web"],
    ["Vue", "package.json", '{"dependencies":{"vue":"1"}}', "vue"],
  ])("detects %s", async (_name, markerPath, content, language) => {
    const root = await createFixture();
    await writeFixtureFile(root, markerPath, content);

    const result = await detectProject(root);

    expect(result.languages).toEqual([language]);
    expect(result.packages).toEqual([
      expect.objectContaining({ languages: [language], path: "." }),
    ]);
  });

  it("detects a monorepo deterministically with package managers and verification commands", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "pnpm-lock.yaml");
    await writeFixtureFile(root, "apps/api/package.json", JSON.stringify({
      dependencies: { "@nestjs/core": "1" },
      scripts: { test: "vitest", lint: "eslint .", build: "tsc", dev: "node" },
    }));
    await writeFixtureFile(root, "apps/web/package.json", JSON.stringify({
      dependencies: { react: "1" },
      scripts: { typecheck: "tsc --noEmit", test: "vitest" },
    }));

    const result = await detectProject(root);

    expect(result).toEqual({
      languages: ["react-web", "typescript-nestjs"],
      packageManager: "pnpm",
      packages: [
        {
          languages: ["typescript-nestjs"],
          packageManager: "pnpm",
          path: "apps/api",
          verificationCommands: ["pnpm run build", "pnpm run lint", "pnpm run test"],
        },
        {
          languages: ["react-web"],
          packageManager: "pnpm",
          path: "apps/web",
          verificationCommands: ["pnpm run test", "pnpm run typecheck"],
        },
      ],
    });
  });

  it("ignores detection markers in generated and dependency directories", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "node_modules/react/package.json", '{"dependencies":{"react":"1"}}');
    await writeFixtureFile(root, "vendor/go.mod", "module ignored");
    await writeFixtureFile(root, "bin/pom.xml", "<artifactId>spring-boot-starter</artifactId>");
    await writeFixtureFile(root, "obj/pyproject.toml", "[project]");
    await writeFixtureFile(root, "dist/package.json", '{"dependencies":{"vue":"1"}}');
    await writeFixtureFile(root, "build/App.csproj", "<Project />");
    await writeFixtureFile(root, "coverage/package.json", '{"dependencies":{"vue":"1"}}');
    await writeFixtureFile(root, ".cache/package.json", '{"dependencies":{"react":"1"}}');

    await expect(detectProject(root)).resolves.toEqual({
      languages: [],
      packageManager: undefined,
      packages: [],
    });
  });

  it("should_exclude_react_native_when_no_web_runtime_is_present", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "package.json", '{"dependencies":{"react":"1","react-native":"1"}}');
    await expect(detectProject(root)).resolves.toEqual({ languages: [], packageManager: undefined, packages: [] });
  });

  it("does not execute package scripts while discovering them", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "package-lock.json");
    await writeFixtureFile(root, "package.json", JSON.stringify({
      dependencies: { vue: "1" },
      scripts: { test: "node -e \"throw new Error('must not run')\"" },
    }));

    await expect(detectProject(root)).resolves.toEqual({
      languages: ["vue"],
      packageManager: "npm",
      packages: [{ languages: ["vue"], packageManager: "npm", path: ".", verificationCommands: ["npm run test"] }],
    });
  });
});
