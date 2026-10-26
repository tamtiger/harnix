import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

/** The acceptance sequence of docs/IMPLEMENTATION_PLAN.md section 11; keep the two in step. */
export const RELEASE_STEPS = [
  { command: "pnpm", args: ["install", "--frozen-lockfile"] },
  { command: "pnpm", args: ["build"] },
  { command: "pnpm", args: ["lint"] },
  { command: "pnpm", args: ["typecheck"] },
  { command: "pnpm", args: ["test"] },
  { command: "pnpm", args: ["pack:check"] },
  { command: "pnpm", args: ["smoke:tarball"] },
  { command: "pnpm", args: ["measure:init"] },
  { command: "pnpm", args: ["measure:footprint"] },
  { command: "pnpm", args: ["scan:release"] },
  { command: "git", args: ["diff", "--check"] },
];

const label = (step) => [step.command, ...step.args].join(" ");

/** Runs the steps one after another, prints each with its exit code and duration, and stops at the first failure. */
export function runReleaseChecks(run, write, clock = Date.now) {
  const ran = [];
  for (const step of RELEASE_STEPS) {
    const started = clock();
    const { status } = run(step);
    const seconds = ((clock() - started) / 1000).toFixed(1);
    write(`${label(step)} => exit ${status ?? "none"} in ${seconds}s`);
    ran.push(label(step));
    if (status !== 0) return { ok: false, failed: label(step), ran };
  }
  return { ok: true, ran };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runReleaseChecks(
    (step) => spawnSync(step.command, step.args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" }),
    (line) => process.stdout.write(`${line}\n`),
  );
  if (!result.ok) {
    process.stderr.write(`release:check stopped at: ${result.failed}\n`);
    process.exitCode = 1;
  }
}
