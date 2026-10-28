import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { GLOBAL_FINDING_CODES } from "src/core/doctor/finding-codes-global.js";
import { PROJECT_FINDING_CODES } from "src/core/doctor/finding-codes-project.js";
import {
  DOCTOR_FINDING_CODES,
  PLATFORM_FINDING_SUFFIXES,
  SHADOW_FINDING_SUFFIXES,
  platformFindingCodes,
} from "src/core/doctor/finding-codes.js";
import { diagnoseProject } from "src/commands/doctor.js";
import { PLATFORM_IDS, platformRecords } from "src/core/platform/registry.js";
import { globalDoctorOptions } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-codes-");
const temporaryUserHome = useTemporaryUserHomes("harnix-doctor-codes-home-");
/**
 * Codes no portable fixture can produce without a module mock (a read that throws, a stat that is denied, a reconcile
 * warning the real engine never emits), which isolate: false forbids. This list may only shrink.
 */
const CODES_WITHOUT_REAL_FIXTURE = new Set(["global-managed-drift", "journal-unreadable", "permission-check-failed"]);
const doctorSources = join("src", "core", "doctor");

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
}

/** Every string literal a doctor module passes to `finding(...)`, `invalid(...)` or a code table. */
async function emittedLiterals(): Promise<Set<string>> {
  const literals = new Set<string>();
  for (const file of await files(doctorSources)) {
    if (!file.endsWith(".ts") || file.includes("finding-codes")) continue;
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(
      /(?:finding|invalid)\(\s*(?:[^"`,()]*\?\s*"([^"]+)"\s*:\s*)?"([a-z0-9-]+)"/gu,
    )) {
      literals.add(match[2]!);
      if (match[1] !== undefined) literals.add(match[1]);
    }
    for (const match of source.matchAll(/"((?:global|legacy|task|journal|managed|config|active)-[a-z-]+)"/gu)) {
      literals.add(match[1]!);
    }
  }
  return literals;
}

describe("doctor finding catalog", () => {
  it("lists every code once, sorted, in kebab case", () => {
    expect(new Set(DOCTOR_FINDING_CODES).size).toBe(DOCTOR_FINDING_CODES.length);
    expect([...DOCTOR_FINDING_CODES]).toEqual([...DOCTOR_FINDING_CODES].sort());
    for (const code of DOCTOR_FINDING_CODES) expect(code).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)+$/u);
  });

  it("builds the platform codes from the registry", () => {
    const codes = platformFindingCodes();

    expect(codes).toHaveLength(
      PLATFORM_IDS.length * PLATFORM_FINDING_SUFFIXES.length +
        platformRecords().flatMap((record) => record.shadowingFiles).length * SHADOW_FINDING_SUFFIXES.length,
    );
    for (const id of PLATFORM_IDS) expect(codes).toContain(`${id}-trust-pending`);
  });

  it("covers every code the doctor modules can emit and nothing the modules never emit", async () => {
    const emitted = await emittedLiterals();
    const staticCodes = new Set<string>([...PROJECT_FINDING_CODES, ...GLOBAL_FINDING_CODES]);

    for (const code of emitted) {
      if (/^(?:global-(?:status|inspect)|global-managed)$/u.test(code)) continue;
      expect(staticCodes.has(code) || DOCTOR_FINDING_CODES.includes(code), `emitted but not catalogued: ${code}`).toBe(
        true,
      );
    }
    for (const code of staticCodes) expect(emitted.has(code), `catalogued but never emitted: ${code}`).toBe(true);
  });

  it("has at least one test that names each code, so a new code cannot ship without a fixture", async () => {
    const tests = (await files("test")).filter(
      (file) => file.endsWith(".test.ts") && !file.endsWith("finding-codes.test.ts"),
    );
    const text = (await Promise.all(tests.map((file) => readFile(file, "utf8")))).join("\n");
    const platformBuilt = new Set(platformFindingCodes());

    const unnamed = DOCTOR_FINDING_CODES.filter((code) => {
      if (CODES_WITHOUT_REAL_FIXTURE.has(code)) return false;
      if (!platformBuilt.has(code)) return !text.includes(`"${code}"`) && !text.includes(`'${code}'`);
      const suffix = [...PLATFORM_FINDING_SUFFIXES, ...SHADOW_FINDING_SUFFIXES].find((item) =>
        code.endsWith(`-${item}`),
      )!;
      return !text.includes(code) && !text.includes(`-${suffix}`) && !text.includes(`"${suffix}"`);
    });

    expect(unnamed).toEqual([]);
  });

  it("gives a freshly initialized project zero findings", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });

    const report = await diagnoseProject({ root, ...globalDoctorOptions(home) });

    expect(report.project.findings).toEqual([]);
  });
});
