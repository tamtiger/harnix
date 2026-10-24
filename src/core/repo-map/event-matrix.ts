import { readFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import { compareCodeUnits } from "src/utils/order.js";
import { readConfig } from "src/core/config/config.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
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

async function loadEventsConfig(root: string): Promise<{ wrappers: string[]; linked: string[] }> {
  try {
    const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
    const ev = (config.events ?? {}) as { producerWrappers?: unknown; linkedWorkspaces?: unknown };
    const wrappers = Array.isArray(ev.producerWrappers)
      ? ev.producerWrappers.filter((w): w is string => typeof w === "string")
      : [];
    const top: readonly unknown[] = Array.isArray(config.linkedWorkspaces) ? config.linkedWorkspaces : [];
    const sub: readonly unknown[] = Array.isArray(ev.linkedWorkspaces) ? ev.linkedWorkspaces : [];
    const raw: readonly unknown[] = [...top, ...sub];
    const linked = raw.filter((p): p is string => typeof p === "string").map((p) => resolve(root, p));
    return { wrappers, linked };
  } catch {
    return { wrappers: [], linked: [] };
  }
}

function makeMatrixResult(
  scope: "project" | "workspace",
  matrix: readonly EventMatrixTopicEntry[],
  members?: readonly string[],
): EventMatrixResult {
  return {
    generator: "harnix",
    matrix,
    ...(members !== undefined ? { members } : {}),
    schemaVersion: 1,
    scope,
    status: "ready",
    totalTopics: matrix.length,
  };
}

export async function buildProjectEventMatrix(root: string): Promise<EventMatrixResult> {
  const inventory = await inventoryRepository(root, defaultRepoMapLimits);
  const packageRoots = findPackageRoots(inventory.files);
  const topicMap = new Map<string, TopicAccumulator>();
  const { wrappers: producerWrappers, linked: linkedWorkspaces } = await loadEventsConfig(root);

  await scanFilesForEvents(inventory.files, packageRoots, undefined, topicMap, producerWrappers);

  for (const linkedRoot of linkedWorkspaces) {
    try {
      const linkedInventory = await inventoryRepository(linkedRoot, defaultRepoMapLimits);
      const linkedPackageRoots = findPackageRoots(linkedInventory.files);
      const { wrappers: linkedWrappers } = await loadEventsConfig(linkedRoot);
      const combinedWrappers = [...new Set([...producerWrappers, ...linkedWrappers])];
      await scanFilesForEvents(
        linkedInventory.files,
        linkedPackageRoots,
        basename(linkedRoot),
        topicMap,
        combinedWrappers,
      );
    } catch {
      // ignore inaccessible linked workspace
    }
  }

  const matrix = compileMatrix(topicMap);
  const isMulti = linkedWorkspaces.length > 0;
  const members = isMulti ? [basename(root), ...linkedWorkspaces.map((w) => basename(w))] : undefined;
  return makeMatrixResult(isMulti ? "workspace" : "project", matrix, members);
}

export async function buildMultiWorkspaceEventMatrix(roots: readonly string[]): Promise<EventMatrixResult> {
  const topicMap = new Map<string, TopicAccumulator>();
  const members: string[] = [];

  for (const root of roots) {
    try {
      const name = basename(root);
      members.push(name);
      const inventory = await inventoryRepository(root, defaultRepoMapLimits);
      const packageRoots = findPackageRoots(inventory.files);
      const { wrappers } = await loadEventsConfig(root);
      await scanFilesForEvents(inventory.files, packageRoots, name, topicMap, wrappers);
    } catch {
      // ignore inaccessible root
    }
  }

  return makeMatrixResult("workspace", compileMatrix(topicMap), members);
}

export async function buildWorkspaceEventMatrix(workspaceRoot: string): Promise<EventMatrixResult> {
  const members = await discoverWorkspaceMembers(workspaceRoot);
  if (members.length === 0) {
    return buildProjectEventMatrix(workspaceRoot);
  }

  const topicMap = new Map<string, TopicAccumulator>();
  const { wrappers: workspaceWrappers } = await loadEventsConfig(workspaceRoot);
  for (const member of members) {
    try {
      const inventory = await inventoryRepository(member.path, defaultRepoMapLimits);
      const packageRoots = findPackageRoots(inventory.files);
      const { wrappers: memberWrappers } = await loadEventsConfig(member.path);
      const combinedWrappers = [...new Set([...workspaceWrappers, ...memberWrappers])];
      await scanFilesForEvents(inventory.files, packageRoots, member.name, topicMap, combinedWrappers);
    } catch {
      // ignore inaccessible member
    }
  }

  return makeMatrixResult(
    "workspace",
    compileMatrix(topicMap),
    members.map((m) => m.name),
  );
}

async function scanFilesForEvents(
  files: readonly RepoMapInventoryFile[],
  packageRoots: readonly string[],
  pathPrefix: string | undefined,
  topicMap: Map<string, TopicAccumulator>,
  producerWrappers: readonly string[] = [],
): Promise<void> {
  const constants = await collectConstants(files);

  for (const file of files) {
    if (isTestPath(file.path)) continue;
    const ext = extname(file.path).slice(1).toLowerCase();
    if (!sourceExtensions.has(ext)) continue;

    let content: string;
    try {
      content = await readFile(file.absolutePath, "utf8");
    } catch {
      continue;
    }
    if (content.includes("\0")) continue;

    const events = discoverEvents(content, producerWrappers);
    if (events.topics.length === 0) continue;

    const nearestPkg = nearestPackage(file.path, packageRoots);
    const resolvedPackage = pathPrefix ? (nearestPkg ? `${pathPrefix}/${nearestPkg}` : pathPrefix) : nearestPkg;
    const resolvedFilePath = pathPrefix ? `${pathPrefix}/${file.path}` : file.path;

    for (const t of events.topics) {
      const shortName = t.topic.includes(".") ? (t.topic.split(".").at(-1) ?? t.topic) : t.topic;
      const topicName = constants.get(t.topic) ?? constants.get(shortName) ?? t.topic;
      let entry = topicMap.get(topicName);
      if (!entry) {
        entry = { publishers: [], subscribers: [] };
        topicMap.set(topicName, entry);
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

function isTestPath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  const segments = normalized.split("/");
  if (
    segments.some(
      (seg) =>
        /^(tests?|specs?|__tests__)$/iu.test(seg) ||
        /(^|[._-])(tests?|specs?)$/iu.test(seg) ||
        /[a-z](tests?|specs?)$/u.test(seg),
    )
  ) {
    return true;
  }
  const basename = segments.at(-1) ?? "";
  return /(?:[._-](?:test|spec)|tests?|specs?)\.[^.]+$/iu.test(basename);
}

async function collectConstants(files: readonly RepoMapInventoryFile[]): Promise<Map<string, string>> {
  const constants = new Map<string, string>();
  for (const file of files) {
    if (isTestPath(file.path)) continue;
    const ext = extname(file.path).slice(1).toLowerCase();
    if (ext !== "cs" && ext !== "ts" && ext !== "js") continue;
    let content: string;
    try {
      content = await readFile(file.absolutePath, "utf8");
    } catch {
      continue;
    }
    extractFileConstants(content, constants);
  }
  return constants;
}

function extractFileConstants(content: string, map: Map<string, string>): void {
  const store = (name: string, val: string, prefix = "") => {
    if (prefix) map.set(`${prefix}.${name}`, val);
    map.set(name, val);
  };
  const scan = (text: string, prefix = "") => {
    const constRe = /\b(?:const|readonly)\s+(?:string\s+)?([A-Za-z0-9_]+)\s*=\s*["']([^"']+)["']/gu;
    for (const cm of text.matchAll(constRe)) store(cm[1]!, cm[2]!, prefix);
    const propRe =
      /\bpublic\s+(?:string\s+)?([A-Za-z0-9_]+)\s*\{\s*get;\s*(?:set|init)?;\s*\}\s*=\s*["']([^"']+)["']/gu;
    for (const pm of text.matchAll(propRe)) store(pm[1]!, pm[2]!, prefix);
  };
  const classMatches = [
    ...content.matchAll(
      /\b(?:class|interface|struct|record)\s+([A-Za-z0-9_]+)\b([\s\S]*?)(?=\b(?:class|interface|struct|record)\s+[A-Za-z0-9_]+\b|$)/gu,
    ),
  ];
  if (classMatches.length > 0) {
    for (const match of classMatches) scan(match[2] ?? "", match[1] ?? "");
  } else {
    scan(content);
  }
}

function compileMatrix(topicMap: Map<string, TopicAccumulator>): EventMatrixTopicEntry[] {
  const sortP = (l: EventMatrixParticipant[]) => l.sort((a, b) => compareCodeUnits(a.file, b.file) || a.line - b.line);
  return [...topicMap.keys()].sort(compareCodeUnits).map((topic) => {
    const entry = topicMap.get(topic)!;
    return { publishers: sortP(entry.publishers), subscribers: sortP(entry.subscribers), topic };
  });
}

function findPackageRoots(files: readonly RepoMapInventoryFile[]): string[] {
  return files
    .filter(({ path }) => /(?:package\.json|\.csproj|go\.mod|pom\.xml)$/u.test(path))
    .map(({ path }) => {
      const d = dirname(path).replaceAll("\\", "/");
      return d === "." ? "" : d;
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
