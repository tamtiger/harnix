import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createIsolatedUserEnvironment } from "./isolated-user-home.mjs";
import {
  containsPotentialSecret,
  potentialSecretPattern,
  scanTextFiles,
  structuredSecretPatterns,
} from "./scan-secrets.mjs";
import {
  assertAttribution,
  assertExpectedGlobalSurfaces,
  assertNoDeadPackagedImports,
  assertNoProjectLocalPlatformSurfaces,
  assertNonHarnixContextNoOutput,
  assertNonHarnixContextPerformance,
  assertSetupExitContract,
  assertSingleHarnixExecutable,
  assertSingleHooks,
  assertTarballListing,
  contextFastPathArguments,
  measureNonHarnixContextFastPath,
  run,
  toTarArgumentPath,
  walk,
} from "./scan-release-assertions.mjs";

export {
  assertAttribution,
  assertExpectedGlobalSurfaces,
  assertNoDeadPackagedImports,
  assertNoProjectLocalPlatformSurfaces,
  assertNonHarnixContextNoOutput,
  assertNonHarnixContextPerformance,
  assertSingleHarnixExecutable,
  assertSingleHooks,
  assertTarballListing,
  containsPotentialSecret,
  contextFastPathArguments,
  measureNonHarnixContextFastPath,
  potentialSecretPattern,
  scanTextFiles,
  structuredSecretPatterns,
};

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

export async function runReleaseScan(options = {}) {
  const root = options.root ?? repositoryRoot;
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const artifacts = join(root, ".artifacts");
  const tarballs = (await readdir(artifacts)).filter((name) => name.endsWith(".tgz"));
  if (tarballs.length !== 1)
    throw new Error(`Expected one checked tarball, found ${tarballs.length}. Run pack:check first.`);

  const temporary = await mkdtemp(join(options.temporaryDirectory ?? tmpdir(), "harnix-release-scan-"));
  try {
    const packageManagerHome = join(temporary, "package-manager-home");
    const userHome = join(temporary, "user-home");
    await mkdir(packageManagerHome);
    await mkdir(userHome);
    const tarball = join(artifacts, tarballs[0]);
    const tarballArchiveArgument = toTarArgumentPath(relative(root, tarball));
    const listing = run("tar", ["-tzf", tarballArchiveArgument], root).stdout.split(/\r?\n/u).filter(Boolean);
    await assertTarballListing(listing);
    run("tar", ["-xzf", tarballArchiveArgument, "-C", toTarArgumentPath(temporary)], root);

    const unpacked = join(temporary, "package");
    const packedPackageJson = JSON.parse(await readFile(join(unpacked, "package.json"), "utf8"));
    assertSingleHarnixExecutable(packedPackageJson);
    assertAttribution(await readFile(join(unpacked, "NOTICE"), "utf8"));
    await readFile(join(unpacked, "LICENSE"), "utf8");

    const packagedFiles = await walk(unpacked);
    await scanTextFiles(packagedFiles, "tarball", false);
    await assertNoDeadPackagedImports(unpacked, packedPackageJson);

    const installRoot = join(temporary, "installed");
    await mkdir(installRoot);
    await writeFile(join(installRoot, "package.json"), '{"private":true}\n');
    const packageManagerEntrypoint = process.env.npm_execpath;
    if (!packageManagerEntrypoint) throw new Error("scan:release must run through pnpm or npm.");
    run(
      process.execPath,
      [packageManagerEntrypoint, "add", "--ignore-scripts", "--no-lockfile", tarball],
      installRoot,
      createIsolatedUserEnvironment(packageManagerHome),
    );
    const installedCli = await realpath(join(installRoot, "node_modules", "@tamtiger", "harnix", "dist", "cli.js"));
    const installedPackage = resolve(installedCli, "..", "..");
    const installedRequire = createRequire(join(installedPackage, "package.json"));
    await assertNoDeadPackagedImports(installedPackage, packedPackageJson, {
      resolveBareSpecifier: (specifier) => installedRequire.resolve(specifier),
    });
    const integrationEnvironment = createIsolatedUserEnvironment(userHome, {
      pathPrefix: join(installRoot, "node_modules", ".bin"),
    });
    run(process.execPath, [installedCli, "--help"], installRoot, integrationEnvironment);

    const fixture = join(temporary, "fixture");
    await mkdir(fixture);
    run(
      process.execPath,
      [installedCli, "init", "--user", "scan", "--languages", "vue"],
      fixture,
      integrationEnvironment,
    );
    const setup = run(
      process.execPath,
      [installedCli, "setup", "--kiro", "--antigravity", "--codex", "--claude", "--opencode", "--cursor"],
      fixture,
      integrationEnvironment,
      undefined,
      [0, 1],
    );
    assertSetupExitContract(setup);
    const generatedFiles = [...(await walk(fixture)), ...(await walk(userHome))];
    await scanTextFiles(generatedFiles, "generated fixture", true);
    await assertExpectedGlobalSurfaces(userHome);
    await assertNoProjectLocalPlatformSurfaces(fixture);
    await assertSingleHooks(userHome);
    const ordinaryWorkspace = join(temporary, "ordinary-workspace");
    await mkdir(ordinaryWorkspace);
    const nonHarnixContextPerformance = measureNonHarnixContextFastPath(
      installedCli,
      ordinaryWorkspace,
      integrationEnvironment,
    );
    if ((await readdir(ordinaryWorkspace)).length !== 0) {
      throw new Error("Non-Harnix context hook must not write to the workspace.");
    }

    process.stdout.write(
      `${JSON.stringify({ package: packageJson.name, tarball: tarballs[0], packagedFiles: packagedFiles.length, generatedFiles: generatedFiles.length, nonHarnixContextPerformance, scanned: ["secrets", "machine-paths", "required-todos", "forbidden-surfaces", "one-package", "one-bin", "dead-imports", "duplicate-hooks", "attribution", "non-harnix-context-performance"] })}\n`,
    );
  } finally {
    await rm(temporary, { force: true, recursive: true });
  }
}

const isDirectExecution = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) await runReleaseScan();
