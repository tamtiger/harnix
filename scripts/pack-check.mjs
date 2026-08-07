import { readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const artifactsDirectory = new URL("../.artifacts/", import.meta.url);
await rm(artifactsDirectory, { force: true, recursive: true });
const pnpmEntrypoint = process.env.npm_execpath;
if (pnpmEntrypoint === undefined) throw new Error("pack:check must run through pnpm.");
const packed = spawnSync(process.execPath, [pnpmEntrypoint, "pack", "--pack-destination", ".artifacts"], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
if (packed.status !== 0) throw new Error(`pnpm pack failed: ${packed.error?.message ?? (packed.stderr || packed.stdout)}`);
const tarballs = (await readdir(artifactsDirectory)).filter((name) => name.endsWith(".tgz"));
if (tarballs.length !== 1) throw new Error(`Expected one Harnix tarball, found ${tarballs.length}.`);
if (!tarballs[0]?.startsWith("tamtiger-harnix-")) throw new Error(`Unexpected tarball name: ${tarballs[0]}`);
const contents = spawnSync("tar", ["-tzf", `.artifacts/${tarballs[0]}`], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
if (contents.status !== 0) throw new Error(`Unable to inspect tarball contents: ${contents.error?.message ?? contents.stderr}`);
const files = contents.stdout.split(/\r?\n/u).filter(Boolean);
for (const required of ["package/package.json", "package/LICENSE", "package/NOTICE", "package/dist/cli.js", "package/dist/index.js"]) if (!files.includes(required)) throw new Error(`Tarball is missing ${required}.`);
if (files.some((path) => path.includes("node_modules/") || path.startsWith("package/src/") || path.includes(".artifacts"))) throw new Error("Tarball contains development-only files.");
