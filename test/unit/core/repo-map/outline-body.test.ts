// harnix-secret-waiver: dummy credentials that exercise the secret filter, not real secrets
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createRepoMapOutline } from "src/core/repo-map/outline.js";
import {
  attachSymbolBodies,
  isBodyBlockedPath,
  MAX_BODY_LINES,
  redactSecretLines,
} from "src/core/repo-map/outline-body.js";
import { outlineRepoMap, refreshRepoMap } from "src/core/repo-map/service.js";
import type { RepoMapSymbolOutlineV1 } from "src/core/repo-map/types.js";
import { writeFixtureFiles } from "test/support/repo-map-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-outline-body-");

function symbol(name: string, startLine: number, endLine: number): RepoMapSymbolOutlineV1 {
  return { endLine, exported: true, kind: "function", name, signature: name, startLine };
}

describe("redactSecretLines", () => {
  it.each([
    ["a PHP array entry", "    'password' => 'hunter2hunter2',"],
    ["a JSON property", '  "password": "hunter2hunter2",'],
    ["an array index assignment", "$db['default']['password'] = 'hunter2hunter2';"],
    ["a connection string", 'var cs = "Server=db;User Id=app;Password=hunter2hunter2;";'],
    ["a URL with credentials", 'const url = "postgres://app:hunter2hunter2@db:5432/main";'],
    ["a bearer token", "headers.Authorization = 'Bearer abcdefghijklmnop1234567890';"],
    ["an API key assignment", "const apiKey = 'abcd1234abcd1234';"],
    ["an unquoted YAML value", "password: hunter2xx"],
    ["a cloud access key id", 'const k = "AKIAIOSFODNN7EXAMPLE";'],
    ["a GitHub token", "const t = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789';"],
    ["a Slack token", "const s = 'xoxb-1234567890-abcdefghij';"],
    ["a value in backticks", '"token" : `abcdefghij`'],
  ])("hides %s and keeps the line count", (_label, line) => {
    const redacted = redactSecretLines(["before", line, "after"]);

    expect(redacted).toEqual(["before", "[redacted]", "after"]);
  });

  it("hides a whole private key block", () => {
    const lines = ["x", "-----BEGIN RSA PRIVATE KEY-----", "MIIEabc", "-----END RSA PRIVATE KEY-----", "y"];

    expect(redactSecretLines(lines)).toEqual(["x", "[redacted]", "[redacted]", "[redacted]", "y"]);
  });

  it("leaves ordinary code unchanged", () => {
    const lines = ["function total(items) {", "  return items.reduce((a, b) => a + b, 0);", "}"];

    expect(redactSecretLines(lines)).toEqual(lines);
  });

  it("keeps a declaration that only names a secret-looking field with its type", () => {
    const lines = ["interface Login {", "  password: string;", "  token: unknown;", "  secret: boolean", "}"];

    expect(redactSecretLines(lines)).toEqual(lines);
  });
});

describe("attachSymbolBodies", () => {
  const text = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join("\n");

  it("gives each symbol its own lines", () => {
    const [first, second] = attachSymbolBodies(text, [symbol("a", 2, 4), symbol("b", 7, 8)]);

    expect(first?.body).toEqual(["line 2", "line 3", "line 4"]);
    expect(second?.body).toEqual(["line 7", "line 8"]);
    expect(first?.bodyTruncated).toBeUndefined();
  });

  it("shares one cap of 200 lines across the symbols and marks what it cut", () => {
    const long = Array.from({ length: 500 }, (_, i) => `row ${i + 1}`).join("\n");

    const [first, second] = attachSymbolBodies(long, [symbol("a", 1, 150), symbol("b", 151, 300)]);

    expect(MAX_BODY_LINES).toBe(200);
    expect(first?.body).toHaveLength(150);
    expect(second?.body).toHaveLength(50);
    expect(second?.bodyTruncated).toBe(true);
  });

  it("hides secret lines inside a body", () => {
    const [only] = attachSymbolBodies("function f() {\n  const password = 'hunter2hunter2';\n}\n", [symbol("f", 1, 3)]);

    expect(only?.body).toEqual(["function f() {", "[redacted]", "}"]);
  });
});

describe("isBodyBlockedPath", () => {
  it.each([
    "application/config/database.php",
    "config/database.php",
    "wp-config.php",
    "app/local_settings.py",
    "src/secrets.yaml",
  ])("blocks %s", (path) => {
    expect(isBodyBlockedPath(path)).toBe(true);
  });

  it("allows ordinary source files", () => {
    expect(isBodyBlockedPath("src/core/store.ts")).toBe(false);
  });
});

describe("outline with a body", () => {
  const source = [
    "export function first() {",
    "  return 1;",
    "}",
    "",
    "export function second() {",
    "  return 2;",
    "}",
    "",
  ].join("\n");

  it("returns the source lines of the matched symbol", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "a.ts"), source);

    const result = await createRepoMapOutline({ body: true, limit: 10, root, symbol: "second", target: "a.ts" });

    expect(result.status).toBe("ready");
    expect(result.symbols).toHaveLength(1);
    expect(result.symbols[0]).toMatchObject({
      body: ["export function second() {", "  return 2;", "}"],
      endLine: 7,
      name: "second",
      startLine: 5,
    });
  });

  it("adds nothing without the body option", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "a.ts"), source);

    const result = await createRepoMapOutline({ limit: 10, root, symbol: "second", target: "a.ts" });

    expect(result.symbols[0]).not.toHaveProperty("body");
  });

  it("reads the body only of a file the repository map holds", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "a.ts"), source);
    await refreshRepoMap({ root });
    await writeFile(join(root, "later.ts"), source);

    const indexed = await outlineRepoMap({ body: true, limit: 10, root, symbol: "first", target: "a.ts" });
    const unindexed = await outlineRepoMap({ body: true, limit: 10, root, symbol: "first", target: "later.ts" });

    expect(indexed.status).toBe("ready");
    expect(unindexed).toMatchObject({ hint: "run harnix repo-map --refresh", status: "skipped", symbols: [] });
  });

  it("refuses a file that the ignore rules keep out of the map", async () => {
    const root = await temporaryRepository();
    await writeFixtureFiles(root, { ".harnixignore": "private/\n", "private/hidden.ts": source, "a.ts": source });
    await refreshRepoMap({ root });

    const result = await outlineRepoMap({ body: true, limit: 10, root, symbol: "first", target: "private/hidden.ts" });

    expect(result.status).toBe("skipped");
    expect(result.symbols).toEqual([]);
  });

  it("refuses a configuration file that holds credentials even when it is indexed", async () => {
    const root = await temporaryRepository();
    await writeFixtureFiles(root, {
      "application/config/database.php": "<?php\nfunction connect() {\n  return 1;\n}\n",
    });
    await refreshRepoMap({ root });

    const result = await outlineRepoMap({
      body: true,
      limit: 10,
      root,
      symbol: "connect",
      target: "application/config/database.php",
    });

    expect(result.status).toBe("skipped");
    expect(result.symbols).toEqual([]);
  });
});
