import { randomUUID } from "node:crypto";
import { chmod, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;

export async function syncVersion({ root = process.cwd(), version, summaries, date = new Date().toISOString().slice(0, 10) }) {
  const targetRoot = resolve(root);
  const requested = parseVersion(version);
  const normalizedSummaries = normalizeSummaries(summaries);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) throw new Error("Release date must use YYYY-MM-DD.");

  const packagePath = join(targetRoot, "package.json");
  const changelogPath = join(targetRoot, "CHANGELOG.md");
  const readmePath = join(targetRoot, "README.md");
  const selfHostManifestPath = join(targetRoot, ".harnix", ".template-hashes.json");
  const packageText = await readFile(packagePath, "utf8");
  const packageDocument = JSON.parse(packageText);
  if (typeof packageDocument.version !== "string") throw new Error("package.json must contain a string version.");
  const current = parseVersion(packageDocument.version);
  const comparison = compareVersions(requested, current);
  const skillPaths = await canonicalSkillPaths(targetRoot);
  const changelog = await readFile(changelogPath, "utf8");
  const readme = await readFile(readmePath, "utf8");
  const selfHostManifest = await readFile(selfHostManifestPath, "utf8");
  const nextSelfHostManifest = replaceSelfHostGeneratorVersion(selfHostManifest, version, selfHostManifestPath);
  const heading = `## [${version}] - ${date}`;
  const versionEntry = new RegExp(`^## \\[${version.replaceAll(".", "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}$`, "mu");

  if (comparison < 0) throw new Error(`Requested version ${version} must be greater than current version ${packageDocument.version}.`);
  if (comparison === 0) {
    if (!versionEntry.test(changelog)) throw new Error(`CHANGELOG.md does not contain a release entry for ${version}.`);
    await assertSkillVersions(skillPaths, version);
    const updated = [];
    if (nextSelfHostManifest !== selfHostManifest) {
      await atomicWrite(selfHostManifestPath, nextSelfHostManifest);
      updated.push(".harnix/.template-hashes.json");
    }
    const nextReadme = replaceReadmeVersion(readme, version);
    if (nextReadme !== readme) {
      await atomicWrite(readmePath, nextReadme);
      updated.push("README.md");
    }
    return { changed: updated.length > 0, previousVersion: packageDocument.version, updated, version };
  }
  if (normalizedSummaries.length === 0) throw new Error("At least one non-empty --summary is required for a new release version.");
  if (versionEntry.test(changelog)) throw new Error(`CHANGELOG.md already contains version ${version}.`);

  const updated = [];
  const nextPackageText = packageText.replace(/"version":\s*"[^"]+"/u, `"version": "${version}"`);
  if (nextPackageText === packageText) throw new Error("package.json version could not be updated safely.");
  await atomicWrite(packagePath, nextPackageText);
  updated.push("package.json");

  for (const skillPath of skillPaths) {
    const source = await readFile(skillPath, "utf8");
    await atomicWrite(skillPath, replaceSkillVersion(source, version, skillPath));
    updated.push(relativePath(targetRoot, skillPath));
  }

  await atomicWrite(selfHostManifestPath, nextSelfHostManifest);
  updated.push(".harnix/.template-hashes.json");

  await atomicWrite(changelogPath, insertChangelogEntry(changelog, heading, normalizedSummaries));
  updated.push("CHANGELOG.md");
  await atomicWrite(readmePath, replaceReadmeVersion(readme, version));
  updated.push("README.md");
  return { changed: true, previousVersion: packageDocument.version, updated, version };
}

function parseVersion(value) {
  if (typeof value !== "string" || !semverPattern.test(value)) throw new Error("Version must be strict semver in x.y.z form.");
  return value.split(".").map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1;
  return 0;
}

function normalizeSummaries(summaries) {
  if (!Array.isArray(summaries)) return [];
  return summaries.map((summary) => typeof summary === "string" ? summary.trim() : "").filter((summary) => summary.length > 0 && !/[\r\n]/u.test(summary));
}

async function canonicalSkillPaths(root) {
  const directory = join(root, "src", "skills");
  const entries = await readdir(directory, { withFileTypes: true });
  const skills = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("harnix-")).map((entry) => join(directory, entry.name, "SKILL.md")).sort();
  if (skills.length === 0) throw new Error("No canonical Harnix skill sources were found.");
  await Promise.all(skills.map(async (path) => { await stat(path); }));
  return skills;
}

async function assertSkillVersions(paths, version) {
  for (const path of paths) {
    const source = await readFile(path, "utf8");
    if (skillVersion(source, path) !== version) throw new Error(`Skill metadata is not synchronized: ${path}.`);
  }
}

function replaceSkillVersion(source, version, path) {
  const current = skillVersion(source, path);
  return source.replace(`  version: "${current}"`, `  version: "${version}"`);
}

function skillVersion(source, path) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1];
  const versions = frontmatter ? [...frontmatter.matchAll(/^ {2}version: "([^"\r\n]+)"$/gmu)] : [];
  if (versions.length !== 1) throw new Error(`Expected exactly one metadata.version in ${path}.`);
  return versions[0][1];
}

function insertChangelogEntry(changelog, heading, summaries) {
  const entry = `${heading}\n\n### Changed\n\n${summaries.map((summary) => `- ${summary}`).join("\n")}\n\n`;
  const firstRelease = changelog.search(/^## \[/mu);
  return firstRelease < 0 ? `${changelog.trimEnd()}\n\n${entry}` : `${changelog.slice(0, firstRelease)}${entry}${changelog.slice(firstRelease)}`;
}

function replaceReadmeVersion(readme, version) {
  const replacements = [
    [/source release hiện là `[^`\r\n]+`/u, `source release hiện là \`${version}\``],
    [/với package release, hiện là `[^`\r\n]+`/u, `với package release, hiện là \`${version}\``]
  ];
  return replacements.reduce((updated, [pattern, replacement]) => {
    if (!pattern.test(updated)) throw new Error(`README.md is missing a managed current-version claim: ${replacement}.`);
    return updated.replace(pattern, replacement);
  }, readme);
}

function replaceSelfHostGeneratorVersion(source, version, path) {
  let document;
  try {
    document = JSON.parse(source);
  } catch {
    throw new Error(`Self-host manifest is not valid JSON: ${path}.`);
  }
  if (!isRecord(document) || document.generator !== "harnix" || document.schemaVersion !== 1 || !Array.isArray(document.entries) || document.entries.length === 0) {
    throw new Error(`Self-host manifest has an invalid structure: ${path}.`);
  }
  if (!document.entries.every((entry) => isRecord(entry) && typeof entry.generatorVersion === "string")) {
    throw new Error(`Self-host manifest has an invalid generatorVersion entry: ${path}.`);
  }
  if (document.entries.every(({ generatorVersion }) => generatorVersion === version)) return source;
  return `${JSON.stringify({ ...document, entries: document.entries.map((entry) => ({ ...entry, generatorVersion: version })) }, null, 2)}\n`;
}

function isRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value); }

async function atomicWrite(path, contents) {
  const mode = (await stat(path)).mode;
  const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, contents, { encoding: "utf8", mode });
    await chmod(temporary, mode);
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

function relativePath(root, path) { return path.slice(root.length + 1).replaceAll("\\", "/"); }

function parseArguments(argumentsList) {
  const [version, ...rest] = argumentsList;
  const summaries = [];
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] !== "--summary") throw new Error(`Unknown argument: ${rest[index]}`);
    const summary = rest[index + 1];
    if (!summary) throw new Error("--summary requires a value.");
    summaries.push(summary);
    index += 1;
  }
  return { summaries, version };
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  try {
    const result = await syncVersion(parseArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
