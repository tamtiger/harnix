import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { extractRepoMapRecord } from "src/core/repo-map/extract.js";
import type { RepoMapInventoryFile, RepoMapRecordV1 } from "src/core/repo-map/types.js";
import { abpFiles, codeIgniterFiles, typeScriptFiles, writeFixtureFiles } from "test/support/repo-map-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-extract-");

async function inventoryFile(root: string, path: string, content: string | Buffer): Promise<RepoMapInventoryFile> {
  const absolutePath = join(root, path);
  await mkdir(join(absolutePath, ".."), { recursive: true });
  await writeFile(absolutePath, content);
  return { path, absolutePath, byteLength: Buffer.byteLength(content) };
}

describe("repo-map record extraction", () => {
  it("outlines a source file with sorted identifiers, import targets, language and kind", async () => {
    const root = await temporaryRepository();
    const file = await inventoryFile(
      root,
      "packages/api/src/billing.ts",
      'import { db } from "./db.js";\nconst lib = require("lodash");\nexport class Invoice {}\nexport function bill() {}\n',
    );

    const record = await extractRepoMapRecord(file, ["", "packages/api"]);

    expect(record).toMatchObject({
      path: "packages/api/src/billing.ts",
      extension: "ts",
      language: "typescript",
      kind: "source",
      packagePath: "packages/api",
      importTargets: ["./db.js", "lodash"],
      identifiers: ["Invoice", "bill", "lib"],
    });
    expect(record?.contentHash).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("classifies tests, manifests, documentation, configuration and scripts by path and extension", async () => {
    const root = await temporaryRepository();
    const kinds: Record<string, string> = {
      "src/a.test.ts": "test",
      "package.json": "manifest",
      "README.md": "documentation",
      "settings.yaml": "config",
      "tools/run.ps1": "script",
      "data.bin2": "other",
    };
    for (const [path, expected] of Object.entries(kinds)) {
      const record = await extractRepoMapRecord(await inventoryFile(root, path, "content\n"), [""]);
      expect(record?.kind, path).toBe(expected);
    }
  });

  it("extracts markdown headings and uses the root package when no nested package matches", async () => {
    const root = await temporaryRepository();
    const record = await extractRepoMapRecord(
      await inventoryFile(root, "docs/guide.md", "# Title\ntext\n## Second\n"),
      ["", "packages/api"],
    );

    expect(record?.headings).toEqual(["Second", "Title"]);
    expect(record?.packagePath).toBe("");
  });

  it("refuses binary, replacement-heavy, unreadable and secret-named files", async () => {
    const root = await temporaryRepository();
    const binary = await inventoryFile(root, "bin.dat", Buffer.from([0x41, 0x00, 0x42]));
    const garbled = await inventoryFile(root, "garbled.txt", "�".repeat(64));
    const secretNamed = await inventoryFile(root, "config/api_key=abcdefghij.txt", "plain\n");
    const missing: RepoMapInventoryFile = { path: "gone.ts", absolutePath: join(root, "gone.ts"), byteLength: 0 };

    expect(await extractRepoMapRecord(binary, [""])).toBeUndefined();
    expect(await extractRepoMapRecord(garbled, [""])).toBeUndefined();
    expect(await extractRepoMapRecord(secretNamed, [""])).toBeUndefined();
    expect(await extractRepoMapRecord(missing, [""])).toBeUndefined();
  });

  it("drops outline entries that look like secret assignments instead of exposing them", async () => {
    const root = await temporaryRepository();
    const record = await extractRepoMapRecord(
      await inventoryFile(root, "docs/notes.md", "# Overview\n# password: hunter2hunter2\n"),
      [""],
    );

    expect(record?.headings).toEqual(["Overview"]);
  });

  it("extracts C# using namespaces into importTargets", async () => {
    const root = await temporaryRepository();
    const csharpCode = [
      "using System;",
      "using System.Collections.Generic;",
      "using static System.Math;",
      "global using Microsoft.Extensions.Logging;",
      "namespace MyApp;",
      "public class Service {}",
    ].join("\n");
    const record = await extractRepoMapRecord(await inventoryFile(root, "src/Service.cs", csharpCode), [""]);

    expect(record).toMatchObject({
      extension: "cs",
      language: "csharp",
      kind: "source",
      importTargets: ["Microsoft.Extensions.Logging", "System", "System.Collections.Generic", "System.Math"],
      identifiers: ["MyApp", "Service"],
    });
  });

  it("extracts ProjectReference dependencies from C# .csproj files", async () => {
    const root = await temporaryRepository();
    const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <ProjectReference Include="..\\PaymentHub.Core\\PaymentHub.Core.csproj" />
    <ProjectReference Include="../PaymentHub.Domain/PaymentHub.Domain.csproj" />
  </ItemGroup>
</Project>`;
    const file = await inventoryFile(root, "services/PaymentHub.Api/PaymentHub.Api.csproj", csprojContent);
    const record = await extractRepoMapRecord(file, [""]);
    expect(record).toBeDefined();
    expect(record?.importTargets).toContain("../PaymentHub.Core/PaymentHub.Core.csproj");
    expect(record?.importTargets).toContain("../PaymentHub.Domain/PaymentHub.Domain.csproj");
  });
});

async function extract(root: string, path: string, content: string): Promise<RepoMapRecordV1 | undefined> {
  await writeFixtureFiles(root, { [path]: content });
  return extractRepoMapRecord({ path, absolutePath: join(root, path), byteLength: Buffer.byteLength(content) }, [""]);
}

async function extractFixture(
  files: Readonly<Record<string, string>>,
  path: string,
): Promise<RepoMapRecordV1 | undefined> {
  const root = await temporaryRepository();
  await writeFixtureFiles(root, files);
  const content = files[path] ?? "";
  return extractRepoMapRecord({ path, absolutePath: join(root, path), byteLength: Buffer.byteLength(content) }, [""]);
}

describe("identifier selection", () => {
  it("keeps the first 128 declarations in order of appearance instead of the first 128 alphabetically", async () => {
    const root = await temporaryRepository();
    const content = Array.from({ length: 200 }, (_, i) => `function fn_${String(200 - i).padStart(3, "0")}() {}`).join(
      "\n",
    );

    const identifiers = (await extract(root, "src/many.ts", content))?.identifiers ?? [];

    expect(identifiers).toHaveLength(128);
    expect(identifiers).toContain("fn_200");
    expect(identifiers).toContain("fn_073");
    expect(identifiers).not.toContain("fn_072");
    expect(identifiers).toEqual([...identifiers].sort());
    expect(new Set(identifiers).size).toBe(identifiers.length);
  });

  it("keeps the JSON record of a 100 KB source file with 500 declarations at or under 12 KB", async () => {
    const root = await temporaryRepository();
    const filler = "// ".concat("x".repeat(180), "\n");
    const content = Array.from({ length: 500 }, (_, i) => `function handler_${i}() {}\n${filler}`).join("");
    expect(Buffer.byteLength(content)).toBeGreaterThan(90_000);

    const record = await extract(root, "src/big.ts", content);

    expect(JSON.stringify(record, null, 2).length).toBeLessThanOrEqual(12 * 1024);
  });
});

describe("C# and Java members", () => {
  it("indexes C# properties and methods but not constructors, type names or modifiers", async () => {
    const record = await extractFixture(abpFiles, "frt-core/src/Core.Domain/Transactions/Transaction.cs");

    expect(record?.identifiers).toEqual(
      expect.arrayContaining(["PaymentRequestCode", "Counts", "GetFooAsync", "Transaction"]),
    );
    for (const noise of ["Task", "string", "Dictionary", "public", "Guid"])
      expect(record?.identifiers).not.toContain(noise);
  });

  it("does not index an operator keyword as a method name", async () => {
    const root = await temporaryRepository();
    const content = "public class Money { public static implicit operator Money(decimal d) { return null; } }\n";

    const record = await extract(root, "src/Money.cs", content);

    expect(record?.identifiers).not.toContain("operator");
    expect(record?.identifiers).not.toContain("implicit");
  });

  it("indexes a Java method with generic return and array parameters", async () => {
    const root = await temporaryRepository();
    const content =
      "public class App { public static List<String> names(String[] args) { return null; } private final int count; }\n";

    const record = await extract(root, "src/App.java", content);

    expect(record?.identifiers).toEqual(expect.arrayContaining(["App", "names"]));
    expect(record?.identifiers).not.toContain("count");
  });

  it("finds a 1 MB single line of modifiers without a catastrophic scan", async () => {
    const root = await temporaryRepository();
    const content = `${"public ".repeat(150_000)}\n${"List<".repeat(200_000)}\n`;
    const started = Date.now();

    await extract(root, "src/Hostile.cs", content);

    expect(Date.now() - started).toBeLessThan(2_000);
  });
});

describe("PHP", () => {
  it("indexes public, protected and private properties and methods", async () => {
    const record = await extractFixture(codeIgniterFiles, "application/models/M17/M17C78Model.php");

    expect(record?.identifiers).toEqual(
      expect.arrayContaining(["M17C78Model", "warehouse_id", "generateAutoKeyM01ReceiptCode", "destroyWarehouseCode"]),
    );
  });

  it("records use, require and CodeIgniter load calls as import targets", async () => {
    const record = await extractFixture(codeIgniterFiles, "application/controllers/M17/M17C55Controller.php");

    expect(record?.importTargets).toEqual(
      expect.arrayContaining(["App.Models.Foo", "models/Helper.php", "M17/M17C78Model", "m17_helper"]),
    );
  });

  it("does not turn SQL builder strings into import targets", async () => {
    const record = await extractFixture(codeIgniterFiles, "application/models/M17/M17C78Model.php");

    expect(record?.importTargets).toEqual([]);
  });

  it("does not read a closure use clause as a namespace import", async () => {
    const root = await temporaryRepository();
    const record = await extract(root, "src/closure.php", "<?php\n$f = function () use ($a, $b) { return 1; };\n");

    expect(record?.importTargets).toEqual([]);
  });
});

describe("other languages keep their imports", () => {
  it("still reads from and require strings in TypeScript", async () => {
    const record = await extractFixture(typeScriptFiles, "src/modules/index.tsx");

    expect(record?.importTargets).toEqual(["./api"]);
  });

  it("still reads a Python from-import and a Go import block", async () => {
    const root = await temporaryRepository();
    const python = await extract(root, "app/main.py", "from pkg.util import helper\nimport os\n");
    const go = await extract(root, "cmd/main.go", 'package main\nimport (\n\t"fmt"\n\t"net/http"\n)\n');

    expect(python?.importTargets).toEqual(["os", "pkg.util"]);
    expect(go?.importTargets).toEqual(["fmt", "net/http"]);
  });

  it("still reads a Java import", async () => {
    const root = await temporaryRepository();
    const record = await extract(root, "src/App.java", "import java.util.List;\npublic class App {}\n");

    expect(record?.importTargets).toEqual(["java.util.List"]);
  });
});
