# PRD: Safe repository map for fast agent context

## Problem

Coding agents lose time and context budget when they must repeatedly enumerate a repository or open broad groups of files before finding the few files relevant to a task. Harnix already supplies workflow state and a compact repository profile, but it does not provide a fresh, searchable structural map of the current tree.

## Outcome

Harnix can build a local, disposable repo map and query it for a bounded list of relevant paths and compact outlines. The agent then reads the real files it needs. The feature must work without Git, network access, a daemon, or raw-source persistence.

## Users and scenarios

- A coding agent starts planning and needs likely entry points, tests, manifests, and nearby modules.
- A resumed task needs fresh candidates after files changed.
- A mixed monorepo needs results biased toward the current package and language.
- `harnix internal context` may consume an already-fresh map, but a prompt hook must stay fast and read-only.

## Functional requirements

1. Inventory eligible files using repository-relative POSIX paths and repository ignore rules where available.
2. Work in Git and non-Git repositories; Git is an optional optimization, never a requirement.
3. Refuse traversal and symlink or junction escape; do not follow directory symlinks by default.
4. Exclude dependencies, generated output, VCS data, Harnix task/workspace data, binary files, secret-prone paths, and oversized files.
5. Extract compact language-neutral signals first: path, basename, extension, package, language, file kind, identifiers, headings, and import targets.
6. Persist an atomically replaced, schema-versioned cache under `.harnix/cache/` containing no raw source, secrets, or absolute paths.
7. Refresh incrementally from stable fingerprints and make incremental output equivalent to a clean rebuild.
8. Search the map lexically, then apply deterministic Harnix scoring for task terms, path proximity, package, language, file kind, tests, and current task paths.
9. Return a bounded result containing normalized paths, scores/reasons, and compact outlines; the agent reads source files separately.
10. Integrate through hidden internal runtime operations and the existing workflow. Do not add an eighth public command.
11. Diagnose missing, stale, corrupt, or unsafe cache state. Rebuild only during an explicit project operation, never from a global prompt hook.

## Non-functional requirements

- Deterministic output for identical eligible inputs and configuration.
- No network, telemetry, background process, watcher, embeddings, or vector database.
- Warm query p95 below 100 ms for a representative 10,000-file fixture.
- Full refresh target below 3 seconds for 10,000 eligible files or 50 MB of scanned text on the documented reference machine.
- Cache target at or below 8 MB for the representative fixture.
- Bounded memory and concurrency; abort cleanly without corrupting the previous cache.
- Node.js 18 compatibility and Windows, macOS, and Linux path behavior.

## Product decisions

- Use `globby` 14.x for safe, ignore-aware inventory because Harnix supports Node.js 18.
- Use `MiniSearch` for zero-service local lexical candidate retrieval, followed by Harnix-owned deterministic reranking.
- Defer AST-native parsing. Start with lightweight language adapters and add AST parsing later only if measured query-quality gains justify native/dynamic language packages and footprint.
- Store only disposable structural metadata. User source remains the source of truth.

## Acceptance

- Fixtures cover the Harnix TypeScript repository, a C# solution, a mixed monorepo, and a non-Git repository.
- Nested ignore rules, Unicode/spaces, binary files, large files, secret-prone paths, and symlink/junction escapes are tested.
- Repeated clean builds are byte-stable, and incremental refresh equals clean rebuild.
- Golden queries rank the intended implementation, test, manifest, and documentation files near the top.
- Cache inspection proves no raw source, secret fixture values, or absolute machine paths are present.
- Prompt-hook tests prove no map build or filesystem write occurs.
- Focused, full quality, safety, acceptance, tarball, footprint, and release gates pass with fresh evidence.
