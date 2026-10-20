import { existsSync } from "node:fs";
import { join } from "node:path";

import { discoverWorkspaceMembers } from "src/core/repo-map/workspace.js";
import { compareCodeUnits } from "src/utils/order.js";

/** Runs `git <args>` in a directory and resolves with stdout; rejects on a non-zero exit, a timeout or a spawn error. */
export type GitRunner = (cwd: string, args: readonly string[]) => Promise<string>;

export interface WorkspaceGitMember {
  name: string;
  status: "ok" | "error";
  branch: string | null;
  detached: boolean;
  dirty: number;
  upstream: string | null;
  ahead: number | null;
  behind: number | null;
  error?: string;
}

export interface WorkspaceGitStatusResult {
  generator: "harnix";
  schemaVersion: 1;
  scope: "workspace";
  members: WorkspaceGitMember[];
  message?: string;
}

const READ_ONLY_SUBCOMMANDS = new Set(["status", "rev-parse"]);
const STATUS_ARGS = ["--no-optional-locks", "status", "--porcelain=v2", "--branch", "-z"] as const;
const CONCURRENCY = 4;

/** Refuses any git invocation that is not a read-only subcommand run without optional index locks. */
export function assertReadOnlyGit(args: readonly string[]): void {
  const subcommand = args.find((arg) => !arg.startsWith("-"));
  if (args[0] !== "--no-optional-locks" || subcommand === undefined || !READ_ONLY_SUBCOMMANDS.has(subcommand))
    throw new Error("Workspace git status only runs read-only git commands.");
}

/** Parses `git status --porcelain=v2 --branch -z`: header lines carry the branch, every other entry is one change. */
export function parseGitStatusV2(output: string): Omit<WorkspaceGitMember, "name" | "status" | "error"> {
  let head: string | null = null;
  let upstream: string | null = null;
  let ahead: number | null = null;
  let behind: number | null = null;
  let dirty = 0;
  const tokens = output.split("\0");
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    if (token.startsWith("# branch.head ")) head = token.slice("# branch.head ".length);
    else if (token.startsWith("# branch.upstream ")) upstream = token.slice("# branch.upstream ".length);
    else if (token.startsWith("# branch.ab ")) {
      const match = /^# branch\.ab \+(\d+) -(\d+)$/u.exec(token);
      if (match) {
        ahead = Number(match[1]);
        behind = Number(match[2]);
      }
    } else if (token.startsWith("2 ")) {
      dirty += 1;
      index += 1; // a rename or copy is followed by its original path as a separate NUL field
    } else if (/^(?:1 |u |\? )/u.test(token)) dirty += 1;
  }
  const detached = head === "(detached)";
  return { ahead, behind, branch: detached ? null : head, detached, dirty, upstream };
}

async function readMember(name: string, path: string, run: GitRunner): Promise<WorkspaceGitMember> {
  try {
    assertReadOnlyGit(STATUS_ARGS);
    return { ...parseGitStatusV2(await run(path, STATUS_ARGS)), name, status: "ok" };
  } catch {
    return {
      ahead: null,
      behind: null,
      branch: null,
      detached: false,
      dirty: 0,
      error: "git status failed or timed out",
      name,
      status: "error",
      upstream: null,
    };
  }
}

/** Read-only branch, dirty count and upstream distance of every Git repository below a workspace root. */
export async function readWorkspaceGitStatus(root: string, run: GitRunner): Promise<WorkspaceGitStatusResult> {
  const members = (await discoverWorkspaceMembers(root)).filter((member) => existsSync(join(member.path, ".git")));
  const results: WorkspaceGitMember[] = [];
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < members.length) {
      const member = members[next++]!;
      results.push(await readMember(member.name, member.path, run));
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, members.length) }, worker));
  results.sort((a, b) => compareCodeUnits(a.name, b.name));
  return {
    generator: "harnix",
    ...(results.length === 0 ? { message: "No Git repositories found below the workspace root." } : {}),
    members: results,
    schemaVersion: 1,
    scope: "workspace",
  };
}
