import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findDeclaredType, resolveTypeTarget } from "src/core/repo-map/class-lookup.js";
import { outlineRepoMap, refreshRepoMap } from "src/core/repo-map/service.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-class-");

const NL = "\n";
const deposit = [
  "namespace Svc {",
  "  public partial class DepositService {",
  "    public int Collect(int a) { return a; }",
  "    public int Collect(string a, int b) { return b; }",
  "    public async Task<int> Collect(long a) { return 1; }",
  "  }",
  "  public class Other {",
  "    public int Collect(int a) { return 2; }",
  "  }",
  "}",
  "",
].join(NL);
const depositSync = [
  "namespace Svc {",
  "  public partial class DepositService {",
  "    public void Sync() { Collect(1); }",
  "  }",
  "}",
  "",
].join(NL);

async function project(files: Record<string, string>): Promise<string> {
  const root = await temporaryRepository();
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), text);
  }
  await refreshRepoMap({ root });
  return root;
}

describe("--outline <class name>", () => {
  it("outlines the one file that declares the class, even when the file is named differently", async () => {
    const root = await project({
      "Svc/PaymentIntegrationExternalService.cs":
        "public class PaymentIntegrateAPIService {\n  public int Run() { return 1; }\n}\n",
    });

    const result = await outlineRepoMap({ limit: 20, root, target: "PaymentIntegrateAPIService" });

    expect(result).toMatchObject({
      resolvedFrom: "PaymentIntegrateAPIService",
      status: "ready",
      target: "Svc/PaymentIntegrationExternalService.cs",
    });
    expect(result.symbols.map(({ name }) => name)).toEqual(["PaymentIntegrateAPIService", "Run"]);
  });

  it("works with --symbol and --body on the resolved file", async () => {
    const root = await project({ "Svc/Deposit.cs": deposit });

    const result = await outlineRepoMap({ body: true, limit: 20, root, symbol: "Other", target: "Other" });

    expect(result).toMatchObject({ resolvedFrom: "Other", status: "ready", target: "Svc/Deposit.cs" });
    expect(result.symbols[0]?.body?.[0]).toContain("public class Other");
  });

  it("lists every file of a partial class with its line and guesses none", async () => {
    const root = await project({ "Svc/DepositService.cs": deposit, "Svc/DepositService.Sync.cs": depositSync });

    const result = await outlineRepoMap({ limit: 20, root, target: "DepositService" });

    expect(result.status).toBe("not-found");
    expect(result.symbols).toEqual([]);
    expect(result.candidates).toEqual([
      { path: "Svc/DepositService.Sync.cs", startLine: 2 },
      { path: "Svc/DepositService.cs", startLine: 2 },
    ]);
    expect(result.hint).toContain("2 files");
  });

  it("leaves a real path, a root file named like a type and an unknown name as they were", async () => {
    const root = await project({ "Svc/Deposit.cs": deposit, Dockerfile: "FROM node\n" });

    expect(await outlineRepoMap({ limit: 20, root, target: "Svc/Deposit.cs" })).not.toHaveProperty("resolvedFrom");
    expect((await outlineRepoMap({ limit: 20, root, target: "Dockerfile" })).status).toBe("ready");
    const unknown = await outlineRepoMap({ limit: 20, root, target: "NoSuchType" });
    expect(unknown).toMatchObject({ status: "not-found", symbols: [] });
    expect(unknown).not.toHaveProperty("candidates");
  });
});

describe("findDeclaredType and resolveTypeTarget", () => {
  it("never reads a path-like or invalid name as a type", async () => {
    const root = await project({ "Svc/Deposit.cs": deposit });
    const { map } = await refreshRepoMap({ root });

    expect(await findDeclaredType(root, map, "Svc/Deposit.cs")).toEqual([]);
    expect(await findDeclaredType(root, map, "Other.cs")).toEqual([]);
    expect(await findDeclaredType(root, map, "Other")).toEqual([{ path: "Svc/Deposit.cs", startLine: 7 }]);
    expect(resolveTypeTarget({ limit: 5, target: "x" }, [])).toBeUndefined();
  });
});

describe("C# declarations the outline already separates", () => {
  it("lists overloads as separate entries and tells same-named methods of two classes apart by container", async () => {
    const root = await project({ "Svc/Deposit.cs": deposit });

    const { symbols } = await outlineRepoMap({ limit: 20, root, symbol: "Collect", target: "Svc/Deposit.cs" });

    expect(symbols.map(({ container, startLine }) => [container, startLine])).toEqual([
      ["DepositService", 3],
      ["DepositService", 4],
      ["DepositService", 5],
      ["Other", 8],
    ]);
    expect(new Set(symbols.map(({ signature }) => signature)).size).toBe(4);
  });
});
