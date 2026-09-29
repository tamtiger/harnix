import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectVerifyPlan } from "src/commands/verify-plan.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-cmd-verify-plan-");

async function writeFixture(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("inspectVerifyPlan command", () => {
  it("resolves project root and returns verify plan", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "vitest run" },
      }),
    );
    await writeFixture(root, "test/sample.test.ts", "");

    const plan = await inspectVerifyPlan(root);
    expect(plan.generator).toBe("harnix");
    expect(plan.hasTests).toBe(true);
    expect(plan.commands.test).toBe("npm run test");
  });
});
