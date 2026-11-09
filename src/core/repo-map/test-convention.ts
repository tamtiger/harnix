import { posix } from "node:path";

import { compareCodeUnits } from "src/utils/order.js";
import type { RepoMapRecordV1 } from "./types.js";

const layoutSegments = new Set([
  "__tests__",
  "app",
  "integration",
  "lib",
  "pkg",
  "spec",
  "specs",
  "src",
  "test",
  "tests",
  "unit",
]);

/** The name a test file is about: `math` for `math.test.ts`, `test_math.py`, `MathTests.cs` or `MathTest.php`. */
export function extractTestStem(filename: string): string | undefined {
  const withoutExt = filename.replace(/\.[^.]+$/u, "");
  if (withoutExt.endsWith(".test") || withoutExt.endsWith(".spec") || withoutExt.endsWith("_test"))
    return withoutExt.slice(0, -5);
  if (withoutExt.startsWith("test_")) return withoutExt.slice(5);
  if (/(?:Test|Tests|TestCase)$/u.test(withoutExt)) return withoutExt.replace(/(?:Test|Tests|TestCase)$/u, "");
  return undefined;
}

/** A directory with the layout words (`src`, `test`, `unit`, `X.Tests` suffix) removed, so mirrored trees compare equal. */
function canonicalDirectory(path: string): string {
  return posix
    .dirname(path)
    .split("/")
    .map((segment) => segment.replace(/\.(?:unit|integration)?tests?$/iu, ""))
    .filter((segment) => segment !== "." && !layoutSegments.has(segment.toLowerCase()))
    .join("/");
}

function sameTree(testDirectory: string, sourceDirectory: string): boolean {
  return (
    testDirectory === sourceDirectory ||
    testDirectory === "" ||
    sourceDirectory.endsWith(`/${testDirectory}`) ||
    testDirectory.endsWith(`/${sourceDirectory}`)
  );
}

/** Tests written for `sourcePath` by naming and directory convention, in code-unit order. */
export function findConventionTests(sourcePath: string, records: readonly RepoMapRecordV1[]): string[] {
  const sourceStem = posix
    .basename(sourcePath)
    .replace(/\.[^.]+$/u, "")
    .toLowerCase();
  const sourceDirectory = canonicalDirectory(sourcePath);
  const matched: string[] = [];
  for (const record of records) {
    if (record.kind !== "test") continue;
    const testStem = extractTestStem(posix.basename(record.path));
    if (testStem === undefined || testStem.toLowerCase() !== sourceStem) continue;
    if (sameTree(canonicalDirectory(record.path), sourceDirectory)) matched.push(record.path);
  }
  return matched.sort(compareCodeUnits);
}
