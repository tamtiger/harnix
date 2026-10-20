import { describe, expect, it, vi } from "vitest";

import type { HarnixConfigV2 } from "src/core/config/config.js";
import { CONFIG_REFRESH_PACKAGE_LIMIT, mergeDetectedConfig, refreshProjectConfig } from "src/core/config/refresh.js";

const config = (overrides: Partial<HarnixConfigV2> = {}): HarnixConfigV2 => ({
  context: { maxCharacters: 24000, tokenApproximation: 4 },
  developer: "tam",
  generator: "harnix",
  languages: ["csharp"],
  packages: [{ languages: [], path: "portal", technologies: ["react-web"] }],
  platforms: [],
  runtime: { fullContext: false, research: "conditional" },
  schemaVersion: 2,
  technologies: ["dotnet"],
  ...overrides,
});

const pkg = (path: string, languages: string[] = [], technologies: string[] = []) =>
  ({ languages, packageManager: undefined, path, technologies, verificationCommands: [] }) as never;

const detection = (paths: string[], languages: string[] = [], technologies: string[] = []) => ({
  languages: languages as never,
  packages: paths.map((path) => pkg(path, ["csharp"], ["dotnet"])),
  technologies: technologies as never,
});

describe("mergeDetectedConfig", () => {
  const profiled = (paths: string[], languages: string[], technologies: string[]) => ({
    languages: [] as never,
    packages: paths.map((path) => pkg(path, languages, technologies)),
    technologies: [] as never,
  });

  it("adds missing packages with the languages and technologies they bring and keeps existing entries as they are", () => {
    const edited = config({ packages: [{ custom: "keep", languages: ["csharp"], path: "portal", technologies: [] }] });

    const { added, config: merged } = mergeDetectedConfig(
      edited,
      profiled(["svc-b", "portal", "svc-a"], ["csharp", "typescript"], ["dotnet", "redis"]),
    );

    expect(added).toEqual({ languages: ["typescript"], packages: ["svc-a", "svc-b"], technologies: ["redis"] });
    expect(merged.packages.map((item) => item.path)).toEqual(["portal", "svc-a", "svc-b"]);
    expect(merged.packages[0]).toEqual({ custom: "keep", languages: ["csharp"], path: "portal", technologies: [] });
    expect(merged.packages[1]).toEqual({
      languages: ["csharp", "typescript"],
      path: "svc-a",
      technologies: ["dotnet", "redis"],
    });
    expect([merged.languages, merged.technologies]).toEqual([
      ["csharp", "typescript"],
      ["dotnet", "redis"],
    ]);
    expect(merged.developer).toBe("tam");
  });

  it("does not bring back a top-level technology the user removed while no new package needs it", () => {
    const trimmed = config({ technologies: [] });

    const { config: merged, added } = mergeDetectedConfig(trimmed, {
      languages: ["csharp"] as never,
      packages: [pkg("portal", ["csharp"], ["dotnet"])],
      technologies: ["dotnet"] as never,
    });

    expect(added).toEqual({ languages: [], packages: [], technologies: [] });
    expect(merged).toBe(trimmed);
  });

  it("matches configured paths after normalization so an equivalent spelling is not added twice", () => {
    const spelled = config({ packages: [{ languages: [], path: "svc-a", technologies: [] }] });

    expect(mergeDetectedConfig(spelled, detection(["svc-a/", "./svc-a"])).added.packages).toEqual([]);
  });

  it("returns the very same config when nothing is missing, so a second run changes nothing", () => {
    const original = config();
    const first = mergeDetectedConfig(original, detection(["portal"], ["csharp"], ["dotnet"]));
    expect(first.config).toBe(original);
    const added = mergeDetectedConfig(original, detection(["svc"])).config;
    expect(mergeDetectedConfig(added, detection(["svc"])).config).toBe(added);
  });

  it("skips a detected path that is not a valid repository path", () => {
    const { added } = mergeDetectedConfig(config(), detection(["../outside", "ok"]));
    expect(added.packages).toEqual(["ok"]);
  });
});

describe("refreshProjectConfig", () => {
  const many = Array.from(
    { length: CONFIG_REFRESH_PACKAGE_LIMIT + 5 },
    (_, index) => `p${String(index).padStart(2, "0")}`,
  );

  it("lists at most the limit of added packages and counts the rest", async () => {
    const { refreshed } = await refreshProjectConfig("/p", "/p/config.yaml", config(), true, () =>
      Promise.resolve(detection(many)),
    );

    expect(refreshed.added.packages).toHaveLength(CONFIG_REFRESH_PACKAGE_LIMIT);
    expect(refreshed.morePackages).toBe(5);
    expect(refreshed.dryRun).toBe(true);
  });

  it("ignores a detection failure and keeps the config", async () => {
    const original = config();

    const result = await refreshProjectConfig("/p", "/p/config.yaml", original, false, () =>
      Promise.reject(new Error("unreadable")),
    );

    expect(result.config).toBe(original);
    expect(result.refreshed).toEqual({
      added: { languages: [], packages: [], technologies: [] },
      dryRun: false,
      morePackages: 0,
    });
    expect(vi.isMockFunction(refreshProjectConfig)).toBe(false);
  });
});
