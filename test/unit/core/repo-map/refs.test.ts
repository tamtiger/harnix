import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createUnavailableRepoMapRefs, findRepoMapReferences } from "src/core/repo-map/refs.js";
import { refreshRepoMap } from "src/core/repo-map/service.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-refs-");

describe("repository map symbol references", () => {
  it("finds declarations, imports and call references across the repository and scopes by target path", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src", "billing"), { recursive: true });
    await mkdir(join(root, "src", "unrelated"), { recursive: true });
    await mkdir(join(root, "test", "unit", "billing"), { recursive: true });

    await writeFile(
      join(root, "src", "billing", "charge.ts"),
      [
        "export function chargeInvoice(invoiceId: string): string {",
        "  const secret = 'api_key = hidden_secret_token_for_chargeInvoice_999';",
        "  return `charged:${invoiceId}`;",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(root, "src", "billing", "checkout.ts"),
      [
        "import { chargeInvoice } from './charge.js';",
        "",
        "export function runCheckout(id: string): string {",
        "  return chargeInvoice(id);",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(root, "test", "unit", "billing", "charge.test.ts"),
      [
        "import { chargeInvoice } from 'src/billing/charge.js';",
        "export const result = chargeInvoice('inv-1');",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(root, "src", "unrelated", "other.ts"),
      ["export function chargeInvoice(): string {", "  return 'unrelated';", "}", ""].join("\n"),
    );

    const { map } = await refreshRepoMap({ root });

    const scoped = await findRepoMapReferences(map, {
      limit: 20,
      root,
      symbol: "chargeInvoice",
      target: "src/billing/charge.ts",
    });

    expect(scoped).toEqual({
      generator: "harnix",
      limit: 20,
      references: [
        {
          kind: "declaration",
          line: 1,
          path: "src/billing/charge.ts",
          preview: "export function chargeInvoice(invoiceId: string): string {",
        },
        {
          kind: "import",
          line: 1,
          path: "src/billing/checkout.ts",
          preview: "import { chargeInvoice } from './charge.js';",
        },
        {
          kind: "reference",
          line: 4,
          path: "src/billing/checkout.ts",
          preview: "return chargeInvoice(id);",
        },
        {
          kind: "import",
          line: 1,
          path: "test/unit/billing/charge.test.ts",
          preview: "import { chargeInvoice } from 'src/billing/charge.js';",
        },
        {
          kind: "reference",
          line: 2,
          path: "test/unit/billing/charge.test.ts",
          preview: "export const result = chargeInvoice('inv-1');",
        },
      ],
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      symbol: "chargeInvoice",
      target: "src/billing/charge.ts",
      truncated: false,
    });

    const unscoped = await findRepoMapReferences(map, {
      limit: 2,
      root,
      symbol: "chargeInvoice",
    });
    expect(unscoped.references).toHaveLength(2);
    expect(unscoped.truncated).toBe(true);
    expect(unscoped.target).toBeUndefined();
  });

  it("reports not-found, missing and invalid states and validates symbol and path options", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "app.ts"), "export const app = true;\n");
    const { map } = await refreshRepoMap({ root });

    const notFound = await findRepoMapReferences(map, {
      limit: 10,
      root,
      symbol: "app",
      target: "src/missing.ts",
    });
    expect(notFound).toEqual({
      generator: "harnix",
      limit: 10,
      references: [],
      schemaVersion: 1,
      scope: "project",
      status: "not-found",
      symbol: "app",
      target: "src/missing.ts",
      truncated: false,
    });

    expect(createUnavailableRepoMapRefs("missing", { limit: 5, symbol: "app" })).toEqual({
      generator: "harnix",
      limit: 5,
      references: [],
      schemaVersion: 1,
      scope: "project",
      status: "missing",
      symbol: "app",
      truncated: false,
    });

    await expect(findRepoMapReferences(map, { limit: 10, root, symbol: "bad symbol!" })).rejects.toThrow(
      /valid identifier/i,
    );
    await expect(findRepoMapReferences(map, { limit: 0, root, symbol: "app" })).rejects.toThrow(
      /integer between 1 and 20/i,
    );
    await expect(
      findRepoMapReferences(map, { limit: 10, root, symbol: "app", target: "../escape.ts" }),
    ).rejects.toThrow(/exact normalized repository-relative POSIX path/i);
  });
});
