import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseProject } from "../../../src/commands/doctor.js";
import { initializeProject } from "../../../src/commands/init.js";
import { refreshRepoMap } from "../../../src/core/repo-map/service.js";
import { useTemporaryRepositories } from "../../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-doctor-");

describe("repo-map doctor", () => {
  it("reports missing and stale cache, then repairs it only through project doctor fix", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await rm(join(root, ".harnix", "cache", "repo-map-v1.json"));
    await expect(diagnoseProject({ root })).resolves.toMatchObject({ project: { findings: expect.arrayContaining([expect.objectContaining({ code: "repo-map-missing" })]) } });
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "order.ts"), "export const order = 1;\n");
    await refreshRepoMap({ root });
    await writeFile(join(root, "src", "order.ts"), "export const changedOrder = 2;\n");
    await expect(diagnoseProject({ root })).resolves.toMatchObject({ project: { findings: expect.arrayContaining([expect.objectContaining({ code: "repo-map-stale" })]) } });
    await expect(diagnoseProject({ fix: true, root })).resolves.toMatchObject({ project: { findings: [] } });
  });
});
