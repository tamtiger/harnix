import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  inspectDotnetDirectory,
  isDotnetProjectFile,
  isDotnetTestProject,
  isSolutionFile,
  solutionProjectPaths,
} from "src/core/stack/dotnet-projects.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-dotnet-projects-");

async function writeFixture(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

const testProject = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.0.0" />
  </ItemGroup>
</Project>`;
const libraryProject = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Volo.Abp.Ddd.Domain" Version="8.0.0" />
  </ItemGroup>
</Project>`;

function solution(...paths: string[]): string {
  return paths
    .map(
      (path, index) =>
        `Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "P${index}", "${path}", "{0000000${index}-0000-0000-0000-000000000000}"\nEndProject`,
    )
    .join("\n");
}

describe("isDotnetTestProject", () => {
  it("recognises the test sdk, an explicit flag and the common test framework references", () => {
    expect(isDotnetTestProject(testProject)).toBe(true);
    expect(
      isDotnetTestProject("<Project><PropertyGroup><IsTestProject>true</IsTestProject></PropertyGroup></Project>"),
    ).toBe(true);
    expect(
      isDotnetTestProject('<Project><ItemGroup><PackageReference Include="xunit" Version="2" /></ItemGroup></Project>'),
    ).toBe(true);
    expect(isDotnetTestProject('<PackageReference Include="NUnit" Version="4" />')).toBe(true);
    expect(isDotnetTestProject('<PackageReference Include="MSTest.TestFramework" Version="3" />')).toBe(true);
  });

  it("does not treat a class library or a project that only mentions a framework in a comment as a test project", () => {
    expect(isDotnetTestProject(libraryProject)).toBe(false);
    expect(isDotnetTestProject('<Project Sdk="Microsoft.NET.Sdk" />')).toBe(false);
    expect(
      isDotnetTestProject("<Project><PropertyGroup><IsTestProject>false</IsTestProject></PropertyGroup></Project>"),
    ).toBe(false);
  });
});

describe("solutionProjectPaths", () => {
  it("lists project paths with forward slashes whatever the separator in the file", () => {
    const text = solution("src\\Api\\Api.csproj", "src/Worker/Worker.fsproj", "tests\\Api.Tests\\Api.Tests.vbproj");

    expect(solutionProjectPaths(text)).toEqual([
      "src/Api/Api.csproj",
      "src/Worker/Worker.fsproj",
      "tests/Api.Tests/Api.Tests.vbproj",
    ]);
  });

  it("ignores solution folders and returns nothing for text without projects", () => {
    expect(
      solutionProjectPaths('Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "Items", "Items", "{1}"\nEndProject'),
    ).toEqual([]);
    expect(solutionProjectPaths("")).toEqual([]);
  });
});

describe("inspectDotnetDirectory", () => {
  it("reports no tests for a class library and gives a plain command", async () => {
    const root = await createFixture();
    await writeFixture(root, "Domain.csproj", libraryProject);

    await expect(inspectDotnetDirectory(root, ["Domain.csproj"])).resolves.toEqual({
      hasTests: false,
      testCommand: "dotnet test",
    });
  });

  it("reports tests for a test project in the directory", async () => {
    const root = await createFixture();
    await writeFixture(root, "App.Tests.csproj", testProject);

    await expect(inspectDotnetDirectory(root, ["App.Tests.csproj"])).resolves.toMatchObject({ hasTests: true });
  });

  it("looks through the projects of a solution and targets the solution file", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "Demo.sln",
      solution("src\\Domain\\Domain.csproj", "test\\Domain.Tests\\Domain.Tests.csproj"),
    );
    await writeFixture(root, "src/Domain/Domain.csproj", libraryProject);
    await writeFixture(root, "test/Domain.Tests/Domain.Tests.csproj", testProject);

    await expect(inspectDotnetDirectory(root, ["Demo.sln"])).resolves.toEqual({
      hasTests: true,
      testCommand: "dotnet test Demo.sln",
    });
  });

  it("reports no tests for a solution whose projects are all libraries", async () => {
    const root = await createFixture();
    await writeFixture(root, "Demo.sln", solution("src\\Domain\\Domain.csproj"));
    await writeFixture(root, "src/Domain/Domain.csproj", libraryProject);

    await expect(inspectDotnetDirectory(root, ["Demo.sln"])).resolves.toEqual({
      hasTests: false,
      testCommand: "dotnet test Demo.sln",
    });
  });

  it("quotes a solution name with spaces, picks the first of several solutions and skips unreadable projects", async () => {
    const root = await createFixture();
    await writeFixture(root, "My App.sln", solution("missing\\Missing.csproj"));
    await writeFixture(root, "Zeta.sln", solution("missing\\Missing.csproj"));

    await expect(inspectDotnetDirectory(root, ["Zeta.sln", "My App.sln"])).resolves.toEqual({
      hasTests: false,
      testCommand: 'dotnet test "My App.sln"',
    });
  });
});

describe("hostile or odd solution files", () => {
  it("keeps a relative sibling project and drops absolute, drive and UNC project paths", () => {
    const text = solution(
      "..\\Shared\\Shared.csproj",
      "C:\\Windows\\Temp\\X.csproj",
      "\\\\attacker\\share\\Y.csproj",
      "//attacker/share/Z.csproj",
      "/etc/Q.csproj",
      "src\\Ok\\Ok.csproj",
    );

    expect(solutionProjectPaths(text)).toEqual(["../Shared/Shared.csproj", "src/Ok/Ok.csproj"]);
  });

  it("parses a huge text without a project in linear time", () => {
    const started = Date.now();

    expect(solutionProjectPaths("Project(".repeat(60_000))).toEqual([]);
    expect(Date.now() - started).toBeLessThan(1_500);
  });

  it("recognises project and solution files whatever their case and including Visual Basic", () => {
    for (const name of ["A.csproj", "A.FSPROJ", "a.VbProj"]) expect(isDotnetProjectFile(name), name).toBe(true);
    for (const name of ["Foo.sln", "FOO.SLN"]) expect(isSolutionFile(name), name).toBe(true);
    for (const name of ["A.cs", "sln", "A.slnx.bak", "proj.json"]) {
      expect(isDotnetProjectFile(name) || isSolutionFile(name), name).toBe(false);
    }
  });
});
