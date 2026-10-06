import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_LIMIT = 200;

const firstLine = (text, limit) => {
  const line = String(text ?? "").split(/\r?\n/u)[0] ?? "";
  return line.length > limit ? `${line.slice(0, limit - 1)}…` : line;
};
const shortName = (name) =>
  String(name)
    .replaceAll("\\", "/")
    .replace(/^.*?\/(test\/)/u, "$1");

/** One line per failing test (`name — first line of the message`), plus one per suite that failed to load. */
export function summarizeFailures(report, limit = DEFAULT_LIMIT) {
  const lines = [];
  for (const file of report?.testResults ?? []) {
    const failed = (file.assertionResults ?? []).filter((test) => test.status === "failed");
    for (const test of failed) lines.push(`${test.fullName} — ${firstLine(test.failureMessages?.[0], limit)}`);
    if (failed.length === 0 && file.status === "failed")
      lines.push(`${shortName(file.name)} (suite) — ${firstLine(file.message, limit)}`);
  }
  return lines;
}

function runSuite(extra) {
  const vitest = resolve("node_modules", "vitest", "vitest.mjs");
  const directory = mkdtempSync(join(tmpdir(), "harnix-failures-"));
  const outputFile = join(directory, "report.json");
  try {
    spawnSync(process.execPath, [vitest, "run", "--reporter=json", `--outputFile=${outputFile}`, ...extra], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return JSON.parse(readFileSync(outputFile, "utf8"));
  } catch (error) {
    throw new Error(`vitest produced no JSON report: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  try {
    const lines = summarizeFailures(runSuite(process.argv.slice(2)));
    process.stdout.write(lines.length === 0 ? "no failing tests\n" : `${lines.join("\n")}\n`);
    process.exitCode = lines.length === 0 ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
