import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { refreshRepoMap } from "src/core/repo-map/service.js";
import { findContentTests } from "src/core/repo-map/test-content.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-test-content-");

describe("repository map content tests", () => {
  it("lists the tests whose text names the class a file declares under its own name, and nothing for a test target", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, "tests"), { recursive: true });
    await writeFile(join(root, "src", "BillingModel.php"), "<?php\nclass BillingModel {}\n");
    await writeFile(join(root, "tests", "test_a.php"), "<?php\n$this->load->model('BillingModel');\n");
    await writeFile(join(root, "tests", "test_b.php"), "<?php\n$x = 'BillingModelExtra';\n");
    const { map } = await refreshRepoMap({ root });

    expect(await findContentTests(map, root, "src/BillingModel.php")).toEqual(["tests/test_a.php"]);
    expect(await findContentTests(map, root, "tests/test_a.php")).toEqual([]);
    expect(await findContentTests(map, root, "src/missing.php")).toEqual([]);
  });
});
