import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

// The release scanner is deliberately exercised through its real script helpers so
// negative fixtures cover the same checks used by `pnpm scan:release`.
type ReleaseScanner = {
  assertAttribution(notice: string): void;
  assertExpectedGlobalSurfaces(home: string): Promise<void>;
  assertNonHarnixContextNoOutput(stdout: string, stderr?: string): void;
  assertNonHarnixContextPerformance(samples: number[]): { max: number; median: number; p95: number; repetitions: number; samples: number[] };
  assertNoDeadPackagedImports(packageRoot: string, packageJson: { dependencies?: Record<string, string> }, options?: { resolveBareSpecifier?(specifier: string): string }): Promise<void>;
  assertNoProjectLocalPlatformSurfaces(project: string): Promise<void>;
  assertSingleHarnixExecutable(packageJson: { bin?: Record<string, string> }): void;
  assertSingleHooks(home: string): Promise<void>;
  assertTarballListing(listing: string[]): Promise<void>;
  scanTextFiles(files: string[], scope: string, generated: boolean): Promise<void>;
};

const releaseScanner = await import(new URL("../../scripts/scan-release.mjs", import.meta.url).href) as ReleaseScanner;
const {
  assertAttribution,
  assertExpectedGlobalSurfaces,
  assertNonHarnixContextNoOutput,
  assertNonHarnixContextPerformance,
  assertNoDeadPackagedImports,
  assertNoProjectLocalPlatformSurfaces,
  assertSingleHarnixExecutable,
  assertSingleHooks,
  assertTarballListing,
  scanTextFiles,
} = releaseScanner;
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const fixture = useTemporaryRepositories("harnix-release-scanner-");

async function writeFixtureFile(root: string, relativePath: string, content: string): Promise<string> {
  const path = join(root, ...relativePath.split("/"));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
  return path;
}

describe("release scanner negative fixtures", () => {
  it.each([
    ["machine_path", "C:\\Users\\release-user\\secret.txt", /Machine path found/u],
    ["machine_path_forward_slash", "C:/Users/release-user/secret.txt", /Machine path found/u],
    ["machine_path_macos", "/Users/release-user/secret.txt", /Machine path found/u],
    ["machine_path_unc", "\\\\server\\private-share\\release-user\\secret.txt", /Machine path found/u],
    ["secret", 'api_key = "12345678"', /Potential secret found/u],
    ["unquoted_secret", "token=12345678", /Potential secret found/u],
    ["required_todo", "REQUIRED TODO: ship this", /Required TODO found/u],
  ])("should_reject_%s_when_packaged_text_contains_a_release_violation", async (_category, content, error) => {
    const root = await fixture();
    const file = await writeFixtureFile(root, "dist/index.js", content);

    await expect(scanTextFiles([file], "negative fixture", false)).rejects.toThrow(error);
  });

  it("should_accept_code_like_escaped_path_separators_without_treating_them_as_a_UNC_path", async () => {
    const root = await fixture();
    const file = await writeFixtureFile(root, "dist/index.js", 'const separators = ["\\\\", "/"];\n');

    await expect(scanTextFiles([file], "negative control", false)).resolves.toBeUndefined();
  });

  it("should_accept_an_HTTPS_URL_without_treating_its_authority_as_a_UNC_path", async () => {
    const root = await fixture();
    const file = await writeFixtureFile(root, "LICENSE", "License text: https://www.gnu.org/licenses/example\n");

    await expect(scanTextFiles([file], "negative control", false)).resolves.toBeUndefined();
  });

  it.each([
    ["unsupported_platform", "gemini-cli", /Forbidden platform surface found/u],
    ["legacy_product_reference", "@tamtiger/trellis", /Forbidden legacy product reference found/u],
  ])("should_reject_%s_when_generated_output_contains_forbidden_surface", async (_category, content, error) => {
    const root = await fixture();
    const file = await writeFixtureFile(root, ".harnix/generated.md", content);

    await expect(scanTextFiles([file], "negative fixture", true)).rejects.toThrow(error);
  });

  it("should_reject_unsafe_or_workspace_tarball_entries_when_release_listing_is_invalid", async () => {
    await expect(assertTarballListing(["package/package.json", "../escape"])).rejects.toThrow(/unsafe path/u);
    await expect(assertTarballListing(["package/package.json", "package/pnpm-workspace.yaml"])).rejects.toThrow(/workspace file/u);
    await expect(assertTarballListing(["package/README.md"])).rejects.toThrow(/exactly one package/u);
  });

  it("should_reject_missing_attribution_when_notice_is_incomplete", async () => {
    expect(() => assertAttribution("Trellis\nECC\n")).toThrow(/Superpowers/u);
  });

  it("should_reject_non_single_harnix_bin_when_package_metadata_is_invalid", () => {
    expect(() => assertSingleHarnixExecutable({ bin: { harnix: "./dist/cli.js", extra: "./dist/extra.js" } })).toThrow(/exactly one harnix executable/u);
  });

  it("should_reject_missing_relative_import_when_packaged_module_is_unresolvable", async () => {
    const root = await fixture();
    await writeFixtureFile(root, "dist/index.js", 'import "./missing.js";\n');

    await expect(assertNoDeadPackagedImports(root, { dependencies: {} })).rejects.toThrow(/Dead packaged import/u);
  });

  it.each([
    ["dynamic_import", 'await import("./missing.js");\n'],
    ["template_literal_dynamic_import", "await import(`./missing.js`);\n"],
    ["commonjs_require", 'require("./missing.js");\n'],
    ["re_export", 'export { value } from "./missing.js";\n'],
  ])("should_reject_%s_when_packaged_module_target_is_missing", async (_kind, source) => {
    const root = await fixture();
    await writeFixtureFile(root, "dist/index.js", source);

    await expect(assertNoDeadPackagedImports(root, { dependencies: {} })).rejects.toThrow(/Dead packaged import/u);
  });

  it("should_reject_undeclared_external_import_when_packaged_module_is_not_a_runtime_dependency", async () => {
    const root = await fixture();
    await writeFixtureFile(root, "dist/index.js", 'import "not-declared";\n');

    await expect(assertNoDeadPackagedImports(root, { dependencies: {} })).rejects.toThrow(/not declared/u);
  });

  it("should_reject_unresolvable_external_subpath_when_declared_dependency_has_no_target", async () => {
    const root = await fixture();
    await writeFixtureFile(root, "dist/index.js", 'import "declared/missing";\n');

    await expect(assertNoDeadPackagedImports(root, { dependencies: { declared: "1.0.0" } }, {
      resolveBareSpecifier: () => { throw new Error("module not found"); },
    })).rejects.toThrow(/cannot be resolved/u);
  });

  it("should_ignore_commented_import_text_when_scanning_packaged_modules", async () => {
    const root = await fixture();
    await writeFixtureFile(root, "dist/index.js", '// import "not-declared";\nimport "node:fs";\n');

    await expect(assertNoDeadPackagedImports(root, { dependencies: {} })).resolves.toBeUndefined();
  });

  it("should_accept_live_relative_import_when_packaged_target_exists", async () => {
    const root = await fixture();
    await writeFixtureFile(root, "dist/index.js", 'import "./shared.js";\n');
    await writeFixtureFile(root, "dist/shared.js", "export const shared = true;\n");

    await expect(assertNoDeadPackagedImports(root, { dependencies: {} })).resolves.toBeUndefined();
  });

  it("should_reject_duplicate_harnix_hook_when_global_fixture_contains_two_codex_entries", async () => {
    const home = await fixture();
    await writeFixtureFile(home, ".codex/hooks.json", JSON.stringify({
      hooks: {
        UserPromptSubmit: [
          { hooks: [{ command: "harnix context --platform codex", type: "command" }] },
          { hooks: [{ command: "harnix context --platform codex", type: "command" }] },
        ],
      },
    }));

    await expect(assertSingleHooks(home)).rejects.toThrow(/one Codex Harnix hook, found 2/u);
  });

  it("should_accept_current_user_global_hook_locations_when_each_platform_has_one_handler", async () => {
    const home = await fixture();
    await writeFixtureFile(home, ".codex/hooks.json", JSON.stringify({
      hooks: {
        UserPromptSubmit: [{ hooks: [{ command: "harnix context --platform codex", type: "command" }] }],
      },
    }));
    await writeFixtureFile(home, ".kiro/hooks/harnix-context.json", JSON.stringify({
      hooks: [{ action: { command: "harnix context --platform kiro" } }],
      version: "v1",
    }));
    for (const root of [".gemini/config/plugins/harnix", ".gemini/antigravity-cli/plugins/harnix"]) {
      await writeFixtureFile(home, `${root}/hooks.json`, JSON.stringify({
        "harnix-context": {
          PreInvocation: [{ command: "harnix context --platform antigravity", type: "command" }],
        },
      }));
    }

    await expect(assertSingleHooks(home)).resolves.toBeUndefined();
  });

  it("should_reject_project_local_platform_surfaces_when_release_fixture_contains_legacy_setup_output", async () => {
    const project = await fixture();
    await writeFixtureFile(project, ".kiro/hooks/harnix-context.kiro.hook", "{}\n");

    await expect(assertNoProjectLocalPlatformSurfaces(project)).rejects.toThrow(/Project-local platform surfaces/u);
  });

  it("should_reject_missing_user_global_surfaces_when_release_fixture_is_incomplete", async () => {
    const home = await fixture();
    await writeFixtureFile(home, ".kiro/harnix/managed.json", "{}\n");

    await expect(assertExpectedGlobalSurfaces(home)).rejects.toThrow(/global integration surface is missing/u);
  });

  it("should_reject_non_empty_hook_output_when_the_release_context_fixture_runs_outside_harnix", () => {
    expect(() => assertNonHarnixContextNoOutput("", "")).not.toThrow();
    expect(() => assertNonHarnixContextNoOutput('{"injectSteps":[]}\n')).toThrow(/must not emit output/u);
    expect(() => assertNonHarnixContextNoOutput("", "unexpected warning\n")).toThrow(/must not emit output/u);
  });

  it("should_report_cold_non_harnix_context_metrics_when_all_release_thresholds_are_met", () => {
    const samples = [120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 300];

    expect(assertNonHarnixContextPerformance(samples)).toMatchObject({
      max: 300,
      median: 190,
      p95: 300,
      repetitions: 15,
    });
  });

  it("should_reject_cold_non_harnix_context_metrics_when_a_release_threshold_is_exceeded", () => {
    const slowMedian = Array.from({ length: 15 }, () => 300);
    const slowP95 = [...Array.from({ length: 14 }, () => 100), 750];

    expect(() => assertNonHarnixContextPerformance(slowMedian)).toThrow(/startup exceeds release thresholds/u);
    expect(() => assertNonHarnixContextPerformance(slowP95)).toThrow(/startup exceeds release thresholds/u);
  });
});
