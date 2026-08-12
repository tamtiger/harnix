# Implementation plan: Repository map

This is a plan-only task. Implementation starts only after the user selects this task for execution.

## Architecture

```text
repository root
  -> inventory (globby 14, ignores, safe paths)
  -> bounded readers and lightweight extractors
  -> normalized repo-map v1 records
  -> atomic cache in .harnix/cache/repo-map-v1.json
  -> MiniSearch lexical candidates
  -> deterministic Harnix reranker
  -> bounded paths, reasons, and outlines
  -> agent reads selected source files
```

Proposed modules:

- `src/core/repo-map/inventory.ts`: enumerate eligible files, ignore policy, root and symlink safety.
- `src/core/repo-map/extract.ts`: binary/size checks and language-neutral plus opt-in language extractors.
- `src/core/repo-map/store.ts`: schema validation, fingerprints, deterministic serialization, atomic replace.
- `src/core/repo-map/search.ts`: MiniSearch document projection, lexical query, deterministic reranking, bounded output.
- `src/core/repo-map/service.ts`: refresh/query orchestration with injected filesystem, clock, and concurrency.
- `src/commands/internal.ts`: hidden `repo-map refresh` and `repo-map query` operations; public command count remains seven.

## Phase R0 — Freeze contracts and measurements

1. Add PRD/workflow/implementation-plan contracts for repo-map v1 before runtime code.
2. Freeze cache schema, ignore policy, freshness model, query request/response, exit semantics, and diagnostic codes.
3. Capture baseline task-start context time, package footprint, and query golden fixtures.
4. Decide reference hardware and corpus generation for the performance thresholds.

Exit: schema and behavior are reviewable without implementation ambiguity.

## Phase R1 — Safe inventory

1. Add `globby@^14` and inject filesystem behavior for tests.
2. Resolve and realpath the project root once; normalize every accepted path to repository-relative POSIX form.
3. Enumerate without following directory symlinks. Apply `.gitignore` semantics plus hard exclusions: `.git`, `node_modules`, `vendor`, `bin`, `obj`, `dist`, `build`, `coverage`, caches, `.harnix/tasks`, and `.harnix/workspace`.
4. Add explicit secret-prone path rules (`.env*`, private keys, credential/token files), binary detection, maximum file size, total byte budget, and bounded concurrency.
5. Treat `git ls-files` only as a measured optional fast path with parity fallback to filesystem inventory.

Tests first: Git/non-Git, nested ignore files, case behavior, Unicode/spaces, traversal, symlink/junction escape, broken links, unreadable files, secrets, binaries, and limits.

Exit: inventory returns a deterministic safe path set and never escapes the project root.

## Phase R2 — Compact extraction and cache v1

1. Define records containing only normalized path, extension/language, package, file kind, size/mtime/content fingerprint, compact identifiers, headings, and import targets.
2. Implement lightweight extractors for common text/config formats and conservative TypeScript/JavaScript structure. Unsupported languages still contribute path and file-kind signals.
3. Sort all records and nested fields before deterministic serialization.
4. Write `.harnix/cache/repo-map-v1.json` with permission-preserving atomic replacement and a validated schema/version header.
5. Reuse unchanged records by fingerprint; remove deleted records; abort without replacing the previous cache on any terminal failure.

Tests first: schema rejection, corruption recovery, byte stability, incremental add/change/delete, clean-build equivalence, atomic failure, and proof that raw source/secrets/absolute paths are absent.

Exit: cache is disposable, deterministic, privacy-bounded, and safely replaceable.

## Phase R3 — Retrieval and reranking

1. Project map records into MiniSearch fields: path, basename, package, identifiers, headings, import targets, language, and file kind.
2. Retrieve a lexical candidate pool (initially 50) with exact, prefix, and conservative fuzzy matching.
3. Apply Harnix-owned stable scoring boosts for current task terms, explicit relevant paths, same package/language, implementation/test pairing, manifests, and path proximity. Use normalized path as the final tie-breaker.
4. Return at most 20 results with component scores/reasons and compact outlines. Never return cached raw source.
5. Serialize/load the search index only if benchmarks show a material benefit and the cache remains portable and versioned.

Tests first: golden queries, typo/prefix behavior, stable ties, package/language bias, test pairing, bounded output, empty/stale map, and adversarial query strings.

Exit: representative queries consistently surface useful files without broad reads.

## Phase R4 — Existing-workflow integration

1. Add hidden operations:
   - `harnix internal repo-map refresh --json`
   - `harnix internal repo-map query --query <text> --limit <n> --json`
2. Let Planning, Continue, Research, Debug, Implement, and Check request refresh/query through shared core behavior when project state is valid.
3. Keep activation guards unchanged. Repository profile fields are discovery seeds; current manifests and the map are verified evidence.
4. Global prompt hooks may read an existing fresh map only. They must never scan, refresh, write, install, or use network access.
5. Add doctor diagnostics for missing/stale/corrupt/unsafe cache. Only explicit project `doctor --fix` may rebuild it.

Tests first: no initialized project, stale map, current map, hook no-write/no-build, JSON stability, cancellation, and all three platform integrations.

Exit: one canonical workflow gains bounded context discovery without a new public command.

## Phase R5 — Quality, safety, and release gate

1. Run the focused, full, safety, acceptance, pack, fake-home tarball, footprint, and release scans in the task validation plan.
2. Benchmark clean refresh, incremental refresh, warm query, peak memory, and cache/package footprint on fixed corpora.
3. Inspect package contents and generated output for absolute paths, fixture secrets, raw-source fragments, platform binaries, and unexpected lifecycle scripts.
4. Validate Windows junctions/path casing, POSIX symlinks, Node 18, and representative TypeScript, C#, mixed, and non-Git repositories.
5. Update changelog and all affected canonical docs with measured results and any accepted threshold changes.

Exit: all acceptance criteria have fresh linked evidence; otherwise persist `verifying` with the exact failing check.

## Rollout and fallback

- Ship repo-map as a compatible cache feature; deleting `.harnix/cache/repo-map-v1.json` fully resets it.
- A corrupt, stale, or unsupported map falls back to the existing bounded discovery behavior with an explicit diagnostic.
- Keep AST support behind a future adapter decision. Do not add native parsers until cross-platform install, language coverage, quality gain, and footprint are measured.

## Open decisions to resolve in R0

- Whether cache freshness uses content hashes for every eligible file or a size/mtime fast path with periodic verification.
- Whether serialized MiniSearch state materially improves startup enough to justify an additional cache section.
- Exact default byte/file/concurrency limits after measuring the representative corpora.
- Which lightweight symbols are safe and useful across C#, Python, Java, Go, and configuration formats without AST packages.
