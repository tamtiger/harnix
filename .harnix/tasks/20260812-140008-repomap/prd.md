# PRD: Safe repository map for fast agent context

## Outcome

Harnix can explicitly build and query a local, disposable repository map so an agent can identify a bounded list of relevant files and structural outlines before opening real source files. The map works with or without Git and remains entirely local.

## In scope

- Safe ignore-aware inventory, compact structural extraction, deterministic cache, lexical search, stable Harnix reranking, hidden internal JSON operations, project Doctor diagnostics, and explicit workflow-stage guidance.
- Cache location: `.harnix/cache/repo-map-v1.json`; it is disposable project data removed by the existing project purge.
- Dependencies: `globby@^14.1.0` for Node-18-compatible inventory and `minisearch@^7.2.0` for in-memory lexical candidates. Harnix owns all persistence, validation, ranking, and public behavior.
- Repository-relative POSIX paths only. No source body, comments, literals, secrets, absolute paths, real user-home values, or serialized third-party index state are persisted.

## Out of scope

- Embeddings, vector database, network access, telemetry, Git requirement/process enumeration, daemon, watcher, native/AST parser, raw-source cache, new public command, global integration mutation, and automatic prompt-hook refresh.
- Any change to the fixed `harnix internal context --platform <id>` protocol or its fast path.

## User-visible behavior

The seven public commands remain unchanged. Advanced workflow use is through unsupported hidden operations:

```text
harnix internal repo-map refresh --json
harnix internal repo-map query --query <text> [--limit <1..20>] --json
```

Refresh requires a valid initialized project and is the only write path. Query is read-only and never scans or refreshes. Global hooks do not call either operation; they preserve their current bounded no-write behavior. Project Doctor reports missing/stale/invalid/unsafe cache state; `doctor --fix` rebuilds only safe missing, stale, or invalid cache after project validation.

## Safety and privacy requirements

- Do not follow directory symlinks/junctions; verify realpath containment for every accepted file.
- Exclude VCS, Harnix/agent tooling, dependency, generated/cache, binary, secret-prone, unreadable, and over-budget files.
- Limits are 10,000 files, 50 MiB total UTF-8 input, 1 MiB/file, and extraction concurrency 16. A limit/unsafe failure preserves any prior cache and returns bounded diagnostics.
- Cache validation rejects corrupt/future schema, unsafe or absolute paths, invalid hashes, unsorted/duplicate records, outline-limit violations, and secret-looking structural fields.
- Refresh output is byte-stable; a content-hash fingerprint over the sorted eligible set ensures incremental extraction produces the same result as a clean rebuild.

## Retrieval requirements

- Persist only records with normalized path, content hash, size, extension, package root, optional language, kind, and capped identifiers/headings/import targets.
- Build MiniSearch from validated records at query time; initial candidates are bounded to 50 and results to 20.
- Rerank deterministically using current task terms/relevant paths, package, profile language/technology, implementation/test pairing, manifest/config role, then normalized path as tie-breaker.
- Result JSON gives path, score, reasons, and structural outline only. The agent separately reads current source.

## Acceptance

1. Git/non-Git, nested-ignore, Unicode/space, binary, large, secret, unreadable, traversal, symlink/junction, and budget fixtures prove no unsafe inventory or source persistence.
2. Cache schema, atomic replacement, corruption handling, deletion reset, byte stability, and clean/incremental equivalence are tested.
3. Golden implementation/test/manifest/document queries prove stable bounded ranking, including package/language/task affinity and adversarial input handling.
4. Hidden operations remain outside public help; the exact platform-hook fast path remains unchanged and performs no map scan/write.
5. Doctor diagnoses and safe `--fix` behavior are project-only; global integration behavior is preserved.
6. Node 18 ESM, type/lint/full/safety/acceptance/tarball/footprint/release gates pass. Fixed fixture measurements meet ≤3 s refresh, <100 ms p95 warm query, and ≤8 MiB cache targets or the task returns to replan.
