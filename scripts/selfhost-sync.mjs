import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE = "src/templates/harnix/workflow.md";
const WORKFLOW = ".harnix/workflow.md";
const MANIFEST = ".harnix/.template-hashes.json";

const normalize = (text) => text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
const sha256 = (text) => createHash("sha256").update(normalize(text), "utf8").digest("hex");

async function readIfPresent(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}

async function atomicWrite(path, content) {
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, content, "utf8");
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

/**
 * Regenerates this repository's own `.harnix/workflow.md` from the packaged template (what `workflowTemplate`
 * returns: LF, one trailing newline) and records its normalized hash and the package version in the manifest.
 */
export async function syncSelfHost({ root = process.cwd() } = {}) {
  const target = resolve(root);
  const source = await readIfPresent(join(target, TEMPLATE));
  if (source === undefined) throw new Error(`${TEMPLATE} was not found; run selfhost:sync from the repository root.`);
  const content = `${normalize(source).trimEnd()}\n`;
  const version = JSON.parse(await readFile(join(target, "package.json"), "utf8")).version;
  const manifestText = await readFile(join(target, MANIFEST), "utf8");
  const manifest = JSON.parse(manifestText);
  const entry = manifest.entries?.find((item) => item.path === WORKFLOW);
  if (entry === undefined) throw new Error(`${MANIFEST} has no entry for ${WORKFLOW}.`);
  entry.generatedHash = sha256(content);
  entry.generatorVersion = version;

  const updated = [];
  if ((await readIfPresent(join(target, WORKFLOW))) !== content) {
    await atomicWrite(join(target, WORKFLOW), content);
    updated.push(WORKFLOW);
  }
  const nextManifest = `${JSON.stringify(manifest, null, 2)}\n`;
  if (nextManifest !== manifestText) {
    await atomicWrite(join(target, MANIFEST), nextManifest);
    updated.push(MANIFEST);
  }
  return { changed: updated.length > 0, updated };
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  try {
    process.stdout.write(`${JSON.stringify(await syncSelfHost())}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
