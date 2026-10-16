import { readFile } from "node:fs/promises";
import { dirname, extname } from "node:path";

import { compareCodeUnits } from "src/utils/order.js";
import { discoverEvents } from "./event-discovery.js";
import { inventoryRepository } from "./inventory.js";
import { defaultRepoMapLimits, type RepoMapInventoryFile } from "./types.js";
import { discoverWorkspaceMembers } from "./workspace.js";

export interface EventMatrixParticipant {
  readonly file: string;
  readonly line: number;
  readonly package: string;
  readonly source: string;
}

export interface EventMatrixTopicEntry {
  readonly topic: string;
  readonly publishers: readonly EventMatrixParticipant[];
  readonly subscribers: readonly EventMatrixParticipant[];
}

export interface EventMatrixResult {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project" | "workspace";
  readonly status: "ready";
  readonly matrix: readonly EventMatrixTopicEntry[];
  readonly totalTopics: number;
  readonly members?: readonly string[] | undefined;
}

const sourceExtensions = new Set(["cs", "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "go", "java"]);

interface TopicAccumulator {
  publishers: EventMatrixParticipant[];
  subscribers: EventMatrixParticipant[];
}

export async function buildProjectEventMatrix(root: string): Promise<EventMatrixResult> {
  const inventory = await inventoryRepository(root, defaultRepoMapLimits);
  const packageRoots = findPackageRoots(inventory.files);
  const topicMap = new Map<string, TopicAccumulator>();

  await scanFilesForEvents(inventory.files, packageRoots, undefined, topicMap);
  const matrix = compileMatrix(topicMap);

  return {
    generator: "harnix",
    matrix,
    schemaVersion: 1,
    scope: "project",
    status: "ready",
    totalTopics: matrix.length,
  };
}

export async function buildWorkspaceEventMatrix(workspaceRoot: string): Promise<EventMatrixResult> {
  const members = await discoverWorkspaceMembers(workspaceRoot);
  if (members.length === 0) {
    return buildProjectEventMatrix(workspaceRoot);
  }

  const topicMap = new Map<string, TopicAccumulator>();
  for (const member of members) {
    try {
      const inventory = await inventoryRepository(member.path, defaultRepoMapLimits);
      const packageRoots = findPackageRoots(inventory.files);
      await scanFilesForEvents(inventory.files, packageRoots, member.name, topicMap);
    } catch {
      // ignore inaccessible member
    }
  }

  const matrix = compileMatrix(topicMap);
  return {
    generator: "harnix",
    matrix,
    members: members.map((m) => m.name),
    schemaVersion: 1,
    scope: "workspace",
    status: "ready",
    totalTopics: matrix.length,
  };
}

async function scanFilesForEvents(
  files: readonly RepoMapInventoryFile[],
  packageRoots: readonly string[],
  pathPrefix: string | undefined,
  topicMap: Map<string, TopicAccumulator>,
): Promise<void> {
  for (const file of files) {
    const ext = extname(file.path).slice(1).toLowerCase();
    if (!sourceExtensions.has(ext)) continue;

    let content: string;
    try {
      content = await readFile(file.absolutePath, "utf8");
    } catch {
      continue;
    }
    if (content.includes("\0")) continue;

    const events = discoverEvents(content);
    if (events.topics.length === 0) continue;

    const nearestPkg = nearestPackage(file.path, packageRoots);
    const resolvedPackage = pathPrefix ? (nearestPkg ? `${pathPrefix}/${nearestPkg}` : pathPrefix) : nearestPkg;
    const resolvedFilePath = pathPrefix ? `${pathPrefix}/${file.path}` : file.path;

    for (const t of events.topics) {
      let entry = topicMap.get(t.topic);
      if (!entry) {
        entry = { publishers: [], subscribers: [] };
        topicMap.set(t.topic, entry);
      }
      const participant: EventMatrixParticipant = {
        file: resolvedFilePath,
        line: t.line,
        package: resolvedPackage,
        source: t.source,
      };
      if (t.role === "publisher") {
        entry.publishers.push(participant);
      } else {
        entry.subscribers.push(participant);
      }
    }
  }
}

function compileMatrix(topicMap: Map<string, TopicAccumulator>): EventMatrixTopicEntry[] {
  const sortedTopics = [...topicMap.keys()].sort(compareCodeUnits);
  const matrix: EventMatrixTopicEntry[] = [];

  for (const topic of sortedTopics) {
    const entry = topicMap.get(topic)!;
    entry.publishers.sort((a, b) => compareCodeUnits(a.file, b.file) || a.line - b.line);
    entry.subscribers.sort((a, b) => compareCodeUnits(a.file, b.file) || a.line - b.line);
    matrix.push({
      publishers: entry.publishers,
      subscribers: entry.subscribers,
      topic,
    });
  }
  return matrix;
}

function findPackageRoots(files: readonly RepoMapInventoryFile[]): string[] {
  return files
    .filter(
      ({ path }) =>
        path.endsWith("package.json") ||
        path.endsWith(".csproj") ||
        path.endsWith("go.mod") ||
        path.endsWith("pom.xml"),
    )
    .map(({ path }) => {
      const dir = dirname(path).replaceAll("\\", "/");
      return dir === "." ? "" : dir;
    });
}

function nearestPackage(path: string, roots: readonly string[]): string {
  const directory = dirname(path).replaceAll("\\", "/");
  return (
    [...roots]
      .sort((left, right) => right.length - left.length || compareCodeUnits(left, right))
      .find((root) => root === "" || directory === root || directory.startsWith(`${root}/`)) ?? ""
  );
}
