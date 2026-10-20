import { describe, expect, it } from "vitest";

import { findPackageRoots } from "src/core/stack/package-roots.js";

const file = (path: string) => ({ path });

function reader(contents: Record<string, string>) {
  return (path: string) => Promise.resolve(contents[path]);
}

const solution = (...projects: string[]): string =>
  projects
    .map(
      (project, index) =>
        `Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "P${index}", "${project}", "{${index}}"\nEndProject`,
    )
    .join("\n");

describe("findPackageRoots", () => {
  it("takes the directory of every package manifest, once and in order", async () => {
    const files = [
      "web/package.json",
      "api/composer.json",
      "svc/pom.xml",
      "svc/build.gradle",
      "go/go.mod",
      "rs/Cargo.toml",
      "py/pyproject.toml",
      "kt/build.gradle.kts",
      "README.md",
    ].map(file);

    await expect(findPackageRoots(files, reader({}))).resolves.toEqual(["api", "go", "kt", "py", "rs", "svc", "web"]);
  });

  it("uses the dot for a manifest at the repository root", async () => {
    await expect(findPackageRoots([file("package.json"), file("src/a.ts")], reader({}))).resolves.toEqual(["."]);
  });

  it("makes the directory of a solution one package and drops the projects it references", async () => {
    const files = [
      "gateway/Gateway.sln",
      "gateway/src/Gateway.Domain/Gateway.Domain.csproj",
      "gateway/test/Gateway.Tests/Gateway.Tests.csproj",
    ].map(file);
    const text = solution("src\\Gateway.Domain\\Gateway.Domain.csproj", "test/Gateway.Tests/Gateway.Tests.csproj");

    await expect(findPackageRoots(files, reader({ "gateway/Gateway.sln": text }))).resolves.toEqual(["gateway"]);
  });

  it("keeps a project that no solution covers and a project that sits in the solution directory", async () => {
    const files = [
      "tools/Gen/Gen.csproj",
      "svc/Svc.sln",
      "svc/Svc.csproj",
      "svc/lib/Lib.fsproj",
      "other/Other.vbproj",
    ].map(file);
    const text = solution("Svc.csproj", "lib\\Lib.fsproj");

    await expect(findPackageRoots(files, reader({ "svc/Svc.sln": text }))).resolves.toEqual([
      "other",
      "svc",
      "tools/Gen",
    ]);
  });

  it("ignores a solution project that escapes the repository and a solution that cannot be read", async () => {
    const files = ["a/A.sln", "b/B.sln", "b/proj/B.csproj"].map(file);
    const escaping = solution("..\\..\\outside\\Out.csproj");

    await expect(findPackageRoots(files, reader({ "a/A.sln": escaping }))).resolves.toEqual(["a", "b", "b/proj"]);
  });

  it("returns nothing for files without a package marker", async () => {
    await expect(findPackageRoots([file("src/a.ts"), file("docs/readme.md")], reader({}))).resolves.toEqual([]);
  });

  it("keeps a manifest directory that a solution project also occupies", async () => {
    const files = ["Web.sln", "src/Web/Web.csproj", "src/Web/package.json"].map(file);
    const text = solution("src/Web/Web.csproj");

    await expect(findPackageRoots(files, reader({ "Web.sln": text }))).resolves.toEqual([".", "src/Web"]);
  });

  it("treats a directory whose name starts with two dots as inside the repository", async () => {
    const files = ["App.sln", "..foo/App.csproj"].map(file);
    const text = solution("..foo/App.csproj");

    await expect(findPackageRoots(files, reader({ "App.sln": text }))).resolves.toEqual(["."]);
  });
});
