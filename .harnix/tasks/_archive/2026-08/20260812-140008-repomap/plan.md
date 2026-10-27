# Implementation plan: repository map v1

This task is now revalidated against Harnix 0.6.1. It is implementation-ready after the contract below; execution remains a separate user request.

## Locked outcome

Harnix gains a local, disposable, searchable structural map under `.harnix/cache/`. It helps an explicitly invoked workflow stage find a small set of current candidate files before source is read. It never persists raw source, performs network I/O, starts a watcher/daemon, requires Git, or changes the seven public commands.

## v1 contract

### Inventory and protection

- Inventory uses `globby@^14.1.0` with Git ignore files when present; non-Git repositories use the same filesystem inventory without Git execution.
- Never follow directory symlinks or junctions. Realpath every accepted file before read; reject files outside the resolved project root and preserve the previous cache on any unsafe/error outcome.
- Always exclude `.git`, `.harnix`, agent/tooling namespaces, dependency trees, and generated/cache trees. Documentation directories remain eligible because documentation is an explicit retrieval target. Exclude files whose normalized basename/path matches `.env*`, `*.pem`, `*.key`, `id_rsa*`, `credentials*`, `secrets*`, or `*token*`.
- Eligible text files are at most 1 MiB each; scanning stops with a diagnostic before exceeding 10,000 files or 50 MiB total UTF-8 input. Read/extract concurrency is 16. Binary data (NUL in the first 8 KiB) is skipped.
- Every input path is repository-relative POSIX. Unicode and spaces are allowed; traversal, absolute paths, malformed UTF-8 replacement-heavy files, unreadable files, broken links, and escapes are skipped with a bounded diagnostic count.

### Cache model

The only persisted cache is `.harnix/cache/repo-map-v1.json`. It is written with permission-preserving atomic replacement and contains no timestamp, absolute root, raw source, literal values, or serialized MiniSearch state:

```ts
interface RepoMapV1 {
  generator: "harnix";
  schemaVersion: 1;
  extractorVersion: 1;
  inventoryFingerprint: string; // SHA-256 of sorted path/contentHash pairs
  records: RepoMapRecordV1[]; // sorted by path
}

interface RepoMapRecordV1 {
  path: string;                // normalized repository-relative POSIX path
  contentHash: string;         // SHA-256 of eligible current text
  byteLength: number;
  extension: string;
  packagePath: string;         // "" for root; otherwise normalized package root
  language?: string;
  kind: "source" | "test" | "manifest" | "config" | "documentation" | "script" | "other";
  identifiers: string[];       // sorted, unique; max 32 each ≤96 chars
  headings: string[];          // sorted, unique; max 16 each ≤120 chars
  importTargets: string[];     // sorted, unique; max 32 each ≤160 chars
}
```

Refresh hashes every eligible current text file, reuses extraction only when `path` and `contentHash` match a valid prior record, removes deleted records, and serializes all fields deterministically. Thus incremental and clean rebuilds are byte-identical. Cache validation rejects unknown schema, unsafe paths, unsorted/duplicate data, invalid hashes, over-limit outlines, secret-looking entries, and absolute paths. A missing/corrupt cache is disposable; query never refreshes it.

### Extraction and retrieval

- v1 extracts only paths/extensions, package boundaries, kind, Markdown headings, import/module targets, and identifier-like declaration names. It never records comments, string literals, values, code bodies, or source fragments.
- `minisearch@^7.2.0` builds an in-memory candidate index from validated records on each query. The persisted Harnix record cache remains the portable source of truth.
- Query accepts 1–256 Unicode characters, tokenizes deterministically, retrieves at most 50 exact/prefix candidates, then applies stable Harnix reranking: explicit task relevant path (+500), matching task title/goal token (+100/token), same package (+50), language/technology affinity (+25), implementation/test counterpart (+20), manifest/config (+10). Ties use normalized path.
- Result output contains at most 20 `{ path, score, reasons, outline }` records. `outline` is the structural fields above, never source text.

### Lifecycle and CLI boundary

- Add hidden, unsupported nested Commander operations in `src/cli-program.ts`:
  - `harnix internal repo-map refresh --json`
  - `harnix internal repo-map query --query <text> [--limit <1..20>] --json`
- They require a valid initialized project, are absent from public help, and return stable JSON. Refresh is the only repo-map write operation. Query validates/loads existing cache and returns a deterministic `missing`, `invalid`, or `ready` diagnosis without scanning.
- Do **not** add a fast path in `src/cli.ts`, change the fixed `internal context --platform` hook protocol, or have global hooks query, scan, refresh, or write the map. Workflow skills may explicitly call hidden query/refresh during Planning, Continue, Research, Debug, Implement, and Check after activation; the hook remains bounded and read-only as it is today.
- Project Doctor inventories cache `missing`, `stale`, `invalid`, or `unsafe` state. It detects staleness only during doctor inventory/explicit refresh. `doctor --fix` may rebuild missing/stale/invalid cache only after project validation; unsafe cache locations are never repaired automatically. Global Doctor behavior is unchanged.

## Affected code and test seams

Create:

- `src/core/repo-map/{types,inventory,extract,store,search,service}.ts`
- `src/commands/repo-map-internal.ts`
- `test/unit/repo-map/{inventory,extract,store,search,service}.test.ts`
- `test/integration/repo-map/{internal,doctor,incremental}.test.ts`

Change:

- `package.json`, `pnpm-lock.yaml`
- `src/cli-program.ts`, `src/commands/doctor.ts`
- `src/templates/harnix/workflow.ts` and canonical workflow/PRD/implementation-plan documents during R0
- `test/unit/cli-fast-path.test.ts`, `test/workflow/internal-context.test.ts`, doctor/CLI integration fixtures, safety/release fixtures.

Inject filesystem, atomic writer, clock-independent hashing, and inventory/extraction concurrency at core boundaries. Do not pass Commander, hook input, process execution, or global-home abstractions into `core/repo-map`.

## RED–GREEN slices

### R0 — contract and dependencies

1. Update canonical PRD/workflow/implementation-plan with the cache path, schema, lifecycle, hidden-operation, Doctor, ownership, privacy, and no-hook-write contract above.
2. Add `globby@^14.1.0` and `minisearch@^7.2.0`; lock them with pnpm. Verify Node 18 ESM import, package footprint, license/attribution, and release scan before later slices use them.
3. Add schema and CLI-boundary RED tests: exact hidden operations parse; public help still lists seven public commands; canonical hook fast path stays exclusive to `internal context --platform`.

### R1 — safe inventory and extraction

1. RED: fixtures for Git/non-Git, nested ignores, Unicode/spaces, binary/large/secret files, malformed paths, unreadable files, symlink/junction/broken-link escape, hard exclusions, and input budgets.
2. GREEN: implement safe Globby adapter and inventory result/diagnostics. Implement conservative no-source extraction and unit-level output caps.
3. Re-run only R1 suites while refactoring identifiers/path normalization.

### R2 — deterministic cache

1. RED: invalid/corrupt/future schemas, atomic failure, prior-cache preservation, sorted output, no raw-source/secret/absolute-path output, incremental add/change/delete, and clean-equivalence fixtures.
2. GREEN: validate, hash, reuse unchanged outlines, atomically write/load `repo-map-v1.json`.
3. Add fixture inspection proving a deleted cache fully resets the feature.

### R3 — query and hidden operations

1. RED: exact/prefix/fuzzy golden queries, stable ties, task/package/language/test boosts, adversarial queries, limits, missing/invalid cache JSON, and no-query-refresh behavior.
2. GREEN: build MiniSearch in memory, rerank, and expose hidden JSON operations through Commander only.
3. Prove `src/cli.ts` and platform hook behavior are unchanged and no map I/O happens on a non-Harnix hook path.

### R4 — Doctor/workflow

1. RED: project Doctor findings for missing/stale/invalid/unsafe cache and `doctor --fix` rebuild only for safe states; global diagnostics remain byte-compatible.
2. GREEN: add project-only diagnostics/rebuild and workflow instruction references for explicit stage use.
3. Validate current config v1/v2 migration remains no-rescan except the explicit repo-map operation.

### R5 — measurements and release

Use fixed TypeScript, C#, mixed-monorepo, and non-Git fixtures. Record clean refresh ≤3 s for ≤10,000 eligible files/50 MiB, warm query p95 <100 ms, cache ≤8 MiB, memory bound, Windows junction and POSIX symlink behavior. Required gates are focused repo-map tests, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, then safety/acceptance/pack/tarball/footprint/release scans.

## Risks, fallback, and non-goals

No native AST parser, Git command, embedding/vector database, watcher, daemon, source persistence, global setup mutation, public command, or automatic hook refresh is in scope. If dependency footprint, Node 18 ESM smoke, deterministic cache, or performance gates fail, delete the cache and retain the existing bounded workflow/context behavior; persist `replan` rather than expanding limits or adding a native parser.
