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
