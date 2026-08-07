import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url))); const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const packages = await findPackages(root); if (packages.length !== 1) throw new Error(`Expected one package.json, found ${packages.length}.`);
if (Object.keys(packageJson.bin ?? {}).join(",") !== "harnix") throw new Error("Release must expose exactly one harnix executable.");
const files = await walk(join(root, "dist"));
for (const file of files) { const text = await readFile(file, "utf8"); if (/C:\\Users\\|\/home\/[^/]+\//u.test(text)) throw new Error(`Machine path found in ${file}.`); if (/(?:api[_-]?key|password|secret|token)\s*[=:]\s*['"][^'"]{8,}/iu.test(text)) throw new Error(`Potential secret found in ${file}.`); }
process.stdout.write(`${JSON.stringify({ package: packageJson.name, files: files.length, scanned: ["secrets", "machine-paths", "one-package", "one-bin"] })}\n`);
async function findPackages(directory) { const entries = await readdir(directory, { withFileTypes: true }); const result = []; for (const entry of entries) { if (["node_modules", ".git", "dist", ".artifacts"].includes(entry.name)) continue; const path = join(directory, entry.name); if (entry.isDirectory()) result.push(...await findPackages(path)); else if (entry.name === "package.json") result.push(path); } return result; }
async function walk(directory) { const entries = await readdir(directory, { withFileTypes: true }); const result = []; for (const entry of entries) { const path = join(directory, entry.name); if (entry.isDirectory()) result.push(...await walk(path)); else result.push(path); } return result; }
