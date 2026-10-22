import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-cli-");
const originalCwd = process.cwd();
const readStdout = (spy: { mock: { calls: unknown[][] } }) =>
  JSON.parse(spy.mock.calls.map((c) => String(c[0])).join(""));
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

describe("repository-map operations", () => {
  it("initializes and supports query or refresh as exclusive repo-map actions", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "billing.ts"), "export function bill(orderId: string) { return orderId; }\n");
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await createProgram().parseAsync(["node", "harnix", "repo-map", "--refresh"], { from: "node" });
    expect(readStdout(stdout)).toMatchObject({ scope: "project", status: "refreshed" });
    stdout.mockClear();
    await createProgram().parseAsync(["node", "harnix", "repo-map", "--query", "billing"], { from: "node" });
    expect(readStdout(stdout)).toMatchObject({
      scope: "project",
      status: "ready",
      results: [expect.objectContaining({ path: "src/billing.ts" })],
    });
    stdout.mockClear();
    await createProgram().parseAsync(["node", "harnix", "repo-map"], { from: "node" });
    expect(readStdout(stdout)).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      records: 2,
    });
    stdout.mockClear();

    expect(createProgram().helpInformation()).toContain("repo-map");
    await expect(runCli(["node", "harnix", "repo-map", "--query", "billing", "--refresh"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "repo-map", "--refresh", "--limit", "3"])).resolves.toBe(2);
  });

  it("reports exact-path dependency impact from cache without changing project files", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "dep.ts"), "export const dependency = true;\n");
    await writeFile(join(root, "src", "billing.ts"), "import './dep';\nexport const billing = true;\n");
    await writeFile(join(root, "src", "api.ts"), "import './billing';\nexport const api = true;\n");
    await writeFile(join(root, "src", "app.ts"), "import './api';\nexport const app = true;\n");
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(
      runCli(["node", "harnix", "repo-map", "--impact", "src/billing.ts", "--depth", "2", "--limit", "20"]),
    ).resolves.toBe(0);

    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "src/billing.ts",
      depth: 2,
      limit: 20,
      dependencies: ["src/dep.ts"],
      dependents: [
        { path: "src/api.ts", distance: 1 },
        { path: "src/app.ts", distance: 2 },
      ],
      truncated: { dependencies: false, dependents: false },
    });
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("returns stable cache/target states and rejects ambiguous impact flags", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "present.ts"), "export const present = true;\n");
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "repo-map", "--impact", "src/missing.ts"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      status: "not-found",
      dependencies: [],
      dependents: [],
    });

    for (const argv of [
      ["node", "harnix", "repo-map", "--impact", "./src/present.ts"],
      ["node", "harnix", "repo-map", "--impact", "src/present.ts", "--depth", "0"],
      ["node", "harnix", "repo-map", "--query", "present", "--impact", "src/present.ts"],
      ["node", "harnix", "repo-map", "--query", "present", "--depth", "2"],
      ["node", "harnix", "repo-map", "--refresh", "--depth", "2"],
    ]) {
      stdout.mockClear();
      await expect(runCli(argv)).resolves.toBe(2);
    }

    const cachePath = join(root, ".harnix", "cache", "repo-map-v1.json");
    await rm(cachePath);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--impact", "src/present.ts"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      status: "missing",
      dependencies: [],
      dependents: [],
    });

    await writeFile(cachePath, "{}\n");
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--impact", "src/present.ts"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      status: "invalid",
      dependencies: [],
      dependents: [],
    });
  });

  it("reports affected tests for TS, Python, and Go via repo-map --tests", async () => {
    const root = await temporaryRepository();
    // TS files
    await mkdir(join(root, "src", "math"), { recursive: true });
    await mkdir(join(root, "test", "unit", "math"), { recursive: true });
    await writeFile(join(root, "src", "math", "calc.ts"), "export const add = (a: number, b: number) => a + b;\n");
    await writeFile(
      join(root, "test", "unit", "math", "calc.test.ts"),
      "import { add } from 'src/math/calc.js';\nexport const testCalc = true;\n",
    );

    // Python files
    await mkdir(join(root, "pkg", "billing"), { recursive: true });
    await writeFile(join(root, "pkg", "billing", "service.py"), "def bill(order):\n    return order\n");
    await writeFile(
      join(root, "pkg", "billing", "test_service.py"),
      "from pkg.billing.service import bill\ndef test_bill():\n    assert True\n",
    );

    // Go files
    await mkdir(join(root, "pkg", "storage"), { recursive: true });
    await writeFile(join(root, "pkg", "storage", "store.go"), "package storage\ntype Store struct{}\n");
    await writeFile(join(root, "pkg", "storage", "store_test.go"), "package storage\nfunc TestStore() {}\n");

    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    // TS test impact
    await expect(runCli(["node", "harnix", "repo-map", "--tests", "src/math/calc.ts"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "src/math/calc.ts",
      limit: 20,
      tests: ["test/unit/math/calc.test.ts"],
      truncated: false,
    });

    // Python test impact
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--tests", "pkg/billing/service.py"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "pkg/billing/service.py",
      limit: 20,
      tests: ["pkg/billing/test_service.py"],
      truncated: false,
    });

    // Go test impact
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--tests", "pkg/storage/store.go"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "pkg/storage/store.go",
      limit: 20,
      tests: ["pkg/storage/store_test.go"],
      truncated: false,
    });

    // Flag validation
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--tests", "src/math/calc.ts", "--depth", "2"])).resolves.toBe(
      2,
    );
    stdout.mockClear();
    await expect(
      runCli(["node", "harnix", "repo-map", "--tests", "src/math/calc.ts", "--impact", "src/math/calc.ts"]),
    ).resolves.toBe(2);
  });

  it("extracts file symbol outlines and looks up symbol references via repo-map --outline and --refs", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(
      join(root, "src", "service.ts"),
      [
        "export class OrderService {",
        "  createOrder(id: string): string {",
        "    return id;",
        "  }",
        "}",
        "export function validateOrder(id: string): boolean {",
        "  return id.length > 0;",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(root, "src", "handler.ts"),
      [
        "import { validateOrder } from './service.js';",
        "export function handle(id: string): boolean {",
        "  return validateOrder(id);",
        "}",
        "",
      ].join("\n"),
    );
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(
      runCli(["node", "harnix", "repo-map", "--outline", "src/service.ts", "--symbol", "validateOrder"]),
    ).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      language: "typescript",
      limit: 20,
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      symbolFilter: "validateOrder",
      symbols: [
        {
          exported: true,
          kind: "function",
          name: "validateOrder",
          signature: "export function validateOrder(id: string): boolean {",
          startLine: 6,
          endLine: 8,
        },
      ],
      target: "src/service.ts",
      truncated: false,
    });

    stdout.mockClear();
    await expect(
      runCli(["node", "harnix", "repo-map", "--refs", "validateOrder", "--path", "src/service.ts"]),
    ).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      limit: 20,
      references: [
        {
          kind: "declaration",
          line: 6,
          path: "src/service.ts",
          preview: "export function validateOrder(id: string): boolean {",
        },
        {
          kind: "import",
          line: 1,
          path: "src/handler.ts",
          preview: "import { validateOrder } from './service.js';",
        },
        {
          kind: "reference",
          line: 3,
          path: "src/handler.ts",
          preview: "return validateOrder(id);",
        },
      ],
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      symbol: "validateOrder",
      target: "src/service.ts",
      truncated: false,
    });

    for (const argv of [
      ["node", "harnix", "repo-map", "--query", "service", "--symbol", "validateOrder"],
      ["node", "harnix", "repo-map", "--outline", "src/service.ts", "--path", "src/service.ts"],
      ["node", "harnix", "repo-map", "--refs", "validateOrder", "--depth", "2"],
      ["node", "harnix", "repo-map", "--outline", "src/service.ts", "--depth", "2"],
    ]) {
      stdout.mockClear();
      await expect(runCli(argv)).resolves.toBe(2);
    }
  });

  it("supports --format compact and outline for query and rejects invalid formats or flag combinations", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(
      join(root, "src", "billing.ts"),
      "export class BillingManager { processInvoice() { return 1; } }\n",
    );
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "repo-map", "--query", "billing", "--format", "compact"])).resolves.toBe(0);
    expect(readStdout(stdout)).toMatchObject({ format: "compact", scope: "project", status: "ready" });

    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--query", "billing", "--format", "outline"])).resolves.toBe(0);
    expect(readStdout(stdout)).toMatchObject({ format: "outline" });

    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--format", "compact"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "repo-map", "--query", "billing", "--format", "invalid"])).resolves.toBe(2);
  });

  it("queries across workspace members when --workspace flag is provided", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "service-x", ".harnix"), { recursive: true });
    await writeFile(join(root, "service-x", ".harnix", "config.yaml"), "generatorVersion: 1\n");
    await writeFile(join(root, "service-x", "order.ts"), "export class OrderService {}\n");
    await mkdir(join(root, "service-y", ".harnix"), { recursive: true });
    await writeFile(join(root, "service-y", ".harnix", "config.yaml"), "generatorVersion: 1\n");
    await writeFile(join(root, "service-y", "order-repo.ts"), "export class OrderRepo {}\n");

    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "repo-map", "--refresh", "--workspace"])).resolves.toBe(0);
    expect(readStdout(stdout)).toMatchObject({ scope: "workspace", status: "refreshed" });

    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--workspace"])).resolves.toBe(0);
    expect(readStdout(stdout)).toMatchObject({ scope: "workspace", status: "ready" });

    stdout.mockClear();
    await expect(
      runCli(["node", "harnix", "repo-map", "--query", "order", "--workspace", "--format", "compact"]),
    ).resolves.toBe(0);
    expect(readStdout(stdout)).toMatchObject({
      format: "compact",
      scope: "workspace",
      results: [{ path: "service-x/order.ts" }, { path: "service-y/order-repo.ts" }],
    });

    stdout.mockClear();
    await expect(
      runCli(["node", "harnix", "repo-map", "--workspace", "--outline", "service-x/order.ts"]),
    ).resolves.toBe(2);
  });
});

async function snapshotTree(root: string): Promise<Array<{ path: string; sha256: string }>> {
  return Promise.all(
    (await walk(root)).map(async (path) => ({
      path: path.slice(root.length + 1).replaceAll("\\", "/"),
      sha256: createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    })),
  );
}

async function walk(root: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
