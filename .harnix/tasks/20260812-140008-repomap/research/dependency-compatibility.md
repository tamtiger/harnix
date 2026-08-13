# Research: repo-map dependency compatibility

- Task: `20260812-140008-repomap`
- Researched: 2026-08-13
- Decision: select the inventory and lexical-candidate dependencies compatible with Harnix Node.js `>=18` and the one-package footprint boundary.

## Repository evidence

- `package.json` declares Node.js `>=18`, TypeScript ESM, and only Commander, Inquirer, and YAML as runtime dependencies.
- The old repo-map plan proposed Globby 14 and MiniSearch, but neither is installed and the current hook runtime is `internal-context-cli.ts`, not the obsolete `src/commands/internal.ts` path.
- Repo-map must remain local, optional for Git, no-network, disposable, and must not turn a prompt hook into a scanner or writer.

## Primary sources

1. [Globby 14.1.0 package manifest](https://raw.githubusercontent.com/sindresorhus/globby/v14.1.0/package.json), accessed 2026-08-13. It declares ESM and `engines.node: >=18`; its inventory dependencies are Fast Glob, Ignore, and path helpers.
2. [MiniSearch 7.2.0 package manifest](https://raw.githubusercontent.com/lucaong/minisearch/v7.2.0/package.json), accessed 2026-08-13. It exposes ESM/CJS builds and has no runtime dependencies.
3. [MiniSearch documentation](https://github.com/lucaong/minisearch), accessed 2026-08-13. It documents local in-memory exact, prefix, fuzzy, field-boosted search and add/remove operations.

## Facts and inference

Facts:

- Globby 14.1.0 is Node 18 compatible, but adds a transitive inventory dependency set.
- MiniSearch 7.2.0 is an ESM-compatible, zero-runtime-dependency lexical search library; it is not a source parser or persistence format.

Harnix reasoning:

- Add `globby@^14.1.0` only for inventory and ignore-file semantics; keep an injected adapter at the core boundary so fixtures do not depend on host Git or an actual user home.
- Add `minisearch@^7.2.0` only for an in-memory candidate pool rebuilt from validated repo-map records. Do not serialize its implementation-specific state in v1; persist the Harnix record cache and rebuild the index on load.
- Reject AST/native parsers and Git command enumeration in v1: they add platform/footprint/process contracts without being necessary for structural retrieval.

## Impact and remaining uncertainty

The refreshed plan fixes both dependency versions and the cache/index boundary. Installation is deferred to the first implementation slice, where lockfile, tarball footprint, safety scan, and Node 18 smoke validation are required before the dependencies become accepted release content.

Performance defaults remain measured implementation inputs, not user-owned product decisions: v1 starts with a 10,000-file candidate ceiling, 50 MiB total UTF-8 read budget, 1 MiB/file limit, concurrency 16, a 50-document lexical pool, and a 20-result output cap. Any failure of the documented performance/footprint gates requires replan rather than silently raising these limits.
