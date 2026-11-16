import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { acceptsSuiteCommand, isSafeSolutionArgument, suiteWithoutTests } from "src/core/workflow/suite-command.js";
import { fileSymlinksSupported } from "test/support/symlink-support.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function monorepo(): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, "svc", "tests"), { recursive: true });
  await writeFile(join(root, "svc", "App.sln"), "");
  await writeFile(
    join(root, "svc", "tests", "App.Tests.csproj"),
    '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Microsoft.NET.Test.Sdk" /></ItemGroup></Project>',
  );
  await mkdir(join(root, "lib"), { recursive: true });
  await writeFile(join(root, "lib", "Lib.csproj"), "<Project />");
  await mkdir(join(root, "plain"), { recursive: true });
  return root;
}

describe("isSafeSolutionArgument", () => {
  it("accepts an existing solution relative to the root, or to the check cwd", async () => {
    const root = await monorepo();

    expect(await isSafeSolutionArgument(root, "svc/App.sln", undefined)).toBe(true);
    expect(await isSafeSolutionArgument(root, "App.sln", "svc")).toBe(true);
  });

  it.each([
    ["a parent segment", "../x.sln"],
    ["an inner parent segment", "svc/../svc/App.sln"],
    ["an absolute path", "/etc/x.sln"],
    ["a drive path", "C:/x.sln"],
    ["a UNC path", "//host/share/x.sln"],
    ["a backslash", "svc\\App.sln"],
    ["a shell separator", "svc/App.sln;rm"],
    ["a command substitution", "svc/$(x).sln"],
    ["an option", "-p.sln"],
    ["a missing file", "svc/Missing.sln"],
    ["another extension", "svc/App.csproj"],
  ])("refuses %s", async (_name, argument) => {
    expect(await isSafeSolutionArgument(await monorepo(), argument, undefined)).toBe(false);
  });

  it.skipIf(!fileSymlinksSupported())(
    "refuses a solution file that is itself a link to a file outside the repository",
    async () => {
      const root = await monorepo();
      const outside = await temporaryRepository();
      await writeFile(join(outside, "Out.sln"), "");
      await symlink(join(outside, "Out.sln"), join(root, "svc", "Linked.sln"), "file");

      expect(await isSafeSolutionArgument(root, "svc/Linked.sln", undefined)).toBe(false);
    },
  );

  it("refuses a solution reached through a link that leaves the repository", async () => {
    const root = await monorepo();
    const outside = await temporaryRepository();
    await writeFile(join(outside, "Out.sln"), "");
    await symlink(outside, join(root, "linked"), "junction");

    expect(await isSafeSolutionArgument(root, "linked/Out.sln", undefined)).toBe(false);
  });
});

describe("acceptsSuiteCommand", () => {
  const known = ["dotnet test"];

  it("accepts the detected project test command", async () => {
    expect(await acceptsSuiteCommand(await monorepo(), "pnpm test", undefined, ["pnpm test"])).toBe(true);
  });

  it("accepts dotnet test with a safe solution path, and a bare dotnet test only in a .NET directory", async () => {
    const root = await monorepo();

    expect(await acceptsSuiteCommand(root, "dotnet test svc/App.sln", undefined, ["pnpm test"])).toBe(true);
    expect(await acceptsSuiteCommand(root, "dotnet test", "svc", ["pnpm test"])).toBe(true);
    expect(await acceptsSuiteCommand(root, "dotnet test", "svc/tests", ["pnpm test"])).toBe(true);
    expect(await acceptsSuiteCommand(root, "dotnet test", "plain", ["pnpm test"])).toBe(false);
    expect(await acceptsSuiteCommand(root, "dotnet test", "lib", ["pnpm test"])).toBe(false);
    expect(await acceptsSuiteCommand(root, "dotnet test", undefined, ["pnpm test"])).toBe(false);
  });

  it("refuses a filtered or option-carrying dotnet test and an unsafe solution path", async () => {
    const root = await monorepo();

    expect(await acceptsSuiteCommand(root, "dotnet test --filter Unit", "svc", ["pnpm test"])).toBe(false);
    expect(await acceptsSuiteCommand(root, "dotnet test ../x.sln", undefined, ["pnpm test"])).toBe(false);
    expect(await acceptsSuiteCommand(root, "node run.js", undefined, ["pnpm test"])).toBe(false);
  });

  it("accepts the root test command at a package cwd only when it is that package's own test command", async () => {
    const root = await monorepo();
    const packages = [
      { path: "packages/a", hasTests: true, commands: { test: "pnpm --filter a test" } },
      { path: "packages/b", hasTests: true, commands: { test: "pnpm test" } },
    ];
    const known = ["pnpm test", "pnpm --filter a test"];

    expect(await acceptsSuiteCommand(root, "pnpm test", "packages/a", known, packages)).toBe(false);
    expect(await acceptsSuiteCommand(root, "pnpm --filter a test", "packages/a", known, packages)).toBe(true);
    expect(await acceptsSuiteCommand(root, "pnpm test", "packages/b/", known, packages)).toBe(true);
    expect(await acceptsSuiteCommand(root, "pnpm test", "packages/other", known, packages)).toBe(false);
    expect(await acceptsSuiteCommand(root, "pnpm test", undefined, known, packages)).toBe(true);
    expect(await acceptsSuiteCommand(root, "pnpm test", ".", known, packages)).toBe(true);
  });

  it("normalizes a ./ or trailing-dot cwd before comparing it with the root and the packages", async () => {
    const root = await monorepo();
    const packages = [{ path: "packages/a", hasTests: true, commands: { test: "pnpm --filter a test" } }];
    const known = ["pnpm test", "pnpm --filter a test"];

    expect(await acceptsSuiteCommand(root, "pnpm test", "./", known, packages)).toBe(true);
    expect(await acceptsSuiteCommand(root, "pnpm test", "./.", known, packages)).toBe(true);
    expect(await acceptsSuiteCommand(root, "pnpm --filter a test", "packages/a/.", known, packages)).toBe(true);
    expect(await acceptsSuiteCommand(root, "pnpm --filter a test", "./packages//a/./", known, packages)).toBe(true);
    expect(await acceptsSuiteCommand(root, "dotnet test", "svc/.", known)).toBe(true);
    expect(await acceptsSuiteCommand(root, "dotnet test App.sln", "./svc/.", known)).toBe(true);
  });

  it("keeps refusing a cwd with .. or an absolute path after normalizing", async () => {
    const root = await monorepo();
    const packages = [{ path: "packages/a", hasTests: true, commands: { test: "pnpm --filter a test" } }];
    const known = ["pnpm test", "pnpm --filter a test"];

    for (const cwd of ["..", "./..", "packages/a/..", "packages/../..", "/", "/packages/a", "C:/packages/a"])
      expect(await acceptsSuiteCommand(root, "pnpm test", cwd, known, packages)).toBe(false);
    expect(await acceptsSuiteCommand(root, "dotnet test", "svc/../svc", known)).toBe(false);
    expect(await acceptsSuiteCommand(root, "dotnet test", "../svc", known)).toBe(false);
  });

  it("judges only the inputs when no test command is detected", async () => {
    expect(await acceptsSuiteCommand(await monorepo(), "anything", undefined, [])).toBe(true);
    expect(known).toHaveLength(1);
  });
});

describe("suiteWithoutTests", () => {
  it("names a solution that references no test project, and stays silent otherwise", async () => {
    const root = await monorepo();
    await mkdir(join(root, "api"), { recursive: true });
    await writeFile(join(root, "api", "Api.sln"), 'Project("{X}") = "Api", "Api.csproj", "{1}"\nEndProject\n');
    await writeFile(join(root, "api", "Api.csproj"), "<Project />");

    expect(await suiteWithoutTests(root, "dotnet test api/Api.sln", undefined)).toMatch(/no test project/u);
    expect(await suiteWithoutTests(root, "dotnet test svc/App.sln", undefined)).toBeUndefined();
    expect(await suiteWithoutTests(root, "pnpm test", undefined)).toBeUndefined();
    expect(await suiteWithoutTests(root, undefined, undefined)).toBeUndefined();
  });
});
