import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildGlobIgnores,
  createGuardedDirectoryFilter,
  targetedSegments,
} from "src/core/verification/transient-directories.js";
import { buildCheck, buildCriterion, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-transient-");

describe("transient directory rules", () => {
  it("collects lower-cased literal segments and ignores globs, negation and a leading ./", () => {
    expect([...targetedSegments("./Src/Binary/**")]).toEqual(["src", "binary"]);
    expect([...targetedSegments("!Api/bin/**")]).toEqual(["api", "bin"]);
    expect([...targetedSegments("**/obj/*.json")]).toEqual(["obj"]);
    expect([...targetedSegments("Api\\Bin\\x.dll")]).toEqual(["api", "bin", "x.dll"]);
  });

  it("builds case-insensitive ignores and drops the ones an input names on purpose", () => {
    const defaults = buildGlobIgnores(new Set());
    expect(defaults).toContain("**/.git/**");
    expect(defaults).toContain("**/.harnix/**");
    expect(defaults).toContain("**/[nN][oO][dD][eE]_[mM][oO][dD][uU][lL][eE][sS]/**");

    const targeted = buildGlobIgnores(new Set([".harnix", "testresults"]));
    expect(targeted).not.toContain("**/.harnix/**");
    expect(targeted.some((pattern) => pattern.includes("[tT][eE][sS][tT]"))).toBe(false);
  });

  it("keeps a guarded directory unless its parent holds the matching build marker", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "Api"), { recursive: true });
    await writeFile(join(root, "Api", "Api.fsproj"), "");
    await mkdir(join(root, "web"), { recursive: true });
    await writeFile(join(root, "web", "pom.xml"), "");
    const isKept = createGuardedDirectoryFilter(root);

    expect(await isKept("Api/bin/a.dll", new Set())).toBe(false);
    expect(await isKept("Api/bin/a.dll", new Set(["bin"]))).toBe(true);
    expect(await isKept("tools/bin/cli.js", new Set())).toBe(true);
    expect(await isKept("web/out/site.js", new Set())).toBe(false);
    expect(await isKept("web/bin/cli.js", new Set())).toBe(true);
    expect(await isKept("missing/dist/a.js", new Set())).toBe(true);
    expect(await isKept("src/a.ts", new Set())).toBe(true);
  });

  it("ignores transient directories in PHP, CodeIgniter and Laravel projects", async () => {
    const root = await temporaryRepository();
    // 1. CodeIgniter 3 project with index.php at root and application/logs, application/cache
    await mkdir(join(root, "ci3", "application", "logs"), { recursive: true });
    await mkdir(join(root, "ci3", "application", "cache"), { recursive: true });
    await mkdir(join(root, "ci3", "application", "controllers"), { recursive: true });
    await writeFile(join(root, "ci3", "index.php"), "<?php");
    await writeFile(join(root, "ci3", "application", "logs", "log-2026-10-18.php"), "ERROR");
    await writeFile(join(root, "ci3", "application", "cache", "data.cache"), "cached");
    await writeFile(join(root, "ci3", "application", "controllers", "Welcome.php"), "<?php");

    // 2. CodeIgniter 4 project with spark and writable/logs, writable/cache
    await mkdir(join(root, "ci4", "writable", "logs"), { recursive: true });
    await mkdir(join(root, "ci4", "writable", "cache"), { recursive: true });
    await mkdir(join(root, "ci4", "app"), { recursive: true });
    await writeFile(join(root, "ci4", "spark"), "#!/usr/bin/env php");
    await writeFile(join(root, "ci4", "writable", "logs", "log-2026.log"), "log");
    await writeFile(join(root, "ci4", "app", "Common.php"), "<?php");

    // 3. Laravel project with artisan and storage/logs
    await mkdir(join(root, "laravel", "storage", "logs"), { recursive: true });
    await mkdir(join(root, "laravel", "app"), { recursive: true });
    await writeFile(join(root, "laravel", "artisan"), "#!/usr/bin/env php");
    await writeFile(join(root, "laravel", "storage", "logs", "laravel.log"), "log");
    await writeFile(join(root, "laravel", "app", "User.php"), "<?php");

    // 4. Standard Composer project with composer.json and root logs/cache
    await mkdir(join(root, "composer-app", "logs"), { recursive: true });
    await mkdir(join(root, "composer-app", "cache"), { recursive: true });
    await mkdir(join(root, "composer-app", "src"), { recursive: true });
    await writeFile(join(root, "composer-app", "composer.json"), "{}");
    await writeFile(join(root, "composer-app", "logs", "app.log"), "log");
    await writeFile(join(root, "composer-app", "src", "Index.php"), "<?php");

    const isKept = createGuardedDirectoryFilter(root);

    // CodeIgniter 3
    expect(await isKept("ci3/application/logs/log-2026-10-18.php", new Set())).toBe(false);
    expect(await isKept("ci3/application/cache/data.cache", new Set())).toBe(false);
    expect(await isKept("ci3/application/controllers/Welcome.php", new Set())).toBe(true);

    // CodeIgniter 4
    expect(await isKept("ci4/writable/logs/log-2026.log", new Set())).toBe(false);
    expect(await isKept("ci4/writable/cache/item.tmp", new Set())).toBe(false);
    expect(await isKept("ci4/app/Common.php", new Set())).toBe(true);

    // Laravel
    expect(await isKept("laravel/storage/logs/laravel.log", new Set())).toBe(false);
    expect(await isKept("laravel/app/User.php", new Set())).toBe(true);

    // Composer app
    expect(await isKept("composer-app/logs/app.log", new Set())).toBe(false);
    expect(await isKept("composer-app/cache/app.cache", new Set())).toBe(false);
    expect(await isKept("composer-app/src/Index.php", new Set())).toBe(true);

    // When explicitly targeted, kept
    expect(await isKept("ci3/application/logs/log-2026-10-18.php", new Set(["logs"]))).toBe(true);
    expect(await isKept("ci4/writable/logs/log-2026.log", new Set(["writable"]))).toBe(true);

    // In a non-PHP directory without markers, keep logs/cache
    expect(await isKept("other/logs/app.log", new Set())).toBe(true);
  });

  it("confirms that changes in php transient directories do not alter inputDigest", async () => {
    const { computeInputDigest } = await import("src/core/verification/input-digest.js");
    const root = await temporaryRepository();
    await mkdir(join(root, "application", "logs"), { recursive: true });
    await mkdir(join(root, "application", "controllers"), { recursive: true });
    await writeFile(join(root, "index.php"), "<?php");
    await writeFile(join(root, "application", "controllers", "Home.php"), "<?php echo 'home';");
    await writeFile(join(root, "application", "logs", "log-2026-10-18.php"), "log 1");

    const sampleTask = buildTaskV3({
      id: "20261018-000000-sample",
      mode: "full",
      status: "in_progress",
      checkpoint: "implementing",
      acceptanceCriteria: [buildCriterion({ id: "ac-1", text: "Test ac" })],
      validationPlan: [buildCheck({ id: "check-ci", scope: "focused", criterionIds: ["ac-1"], inputs: ["**/*"] })],
    });

    const digestBefore = await computeInputDigest(root, sampleTask, "check-ci");

    // Modify transient log file and add a cache file
    await writeFile(join(root, "application", "logs", "log-2026-10-18.php"), "log 2 updated");
    await mkdir(join(root, "application", "cache"), { recursive: true });
    await writeFile(join(root, "application", "cache", "temp.cache"), "cache data");

    const digestAfter = await computeInputDigest(root, sampleTask, "check-ci");

    expect(digestAfter.inputDigest).toBe(digestBefore.inputDigest);
    expect(digestAfter.entries.map((e) => e.path)).toEqual(digestBefore.entries.map((e) => e.path));
    expect(digestAfter.entries.map((e) => e.path)).toContain("application/controllers/Home.php");
    expect(digestAfter.entries.map((e) => e.path)).not.toContain("application/logs/log-2026-10-18.php");
  });
});
