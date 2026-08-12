# Research: Repository inventory and local retrieval libraries

- Task: `20260812-140008-repomap`
- Researched: 2026-08-12
- Scope: library and architecture choices for a local, deterministic repository map on Node.js 18+

## Sources

1. globby repository and API documentation — ignore files, `.gitignore` support, streams, custom filesystem, and directory expansion: https://github.com/sindresorhus/globby
2. globby 14.0.2 package metadata — declares Node.js `>=18`: https://app.unpkg.com/globby@14.0.2/files/package.json
3. MiniSearch repository — local in-memory full-text search, ranking, prefix/fuzzy search, serialization, and zero dependencies: https://github.com/lucaong/minisearch
4. MiniSearch API — document indexing, search options, add/remove, load, and loadJSON: https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html
5. ast-grep JavaScript API — NAPI package usage and dynamic language loading: https://astgrep.com/guide/api-usage/js-api.html
6. ast-grep language support — built-in and dynamic language packages: https://astgrep.com/reference/languages.html
7. `@ast-grep/napi` package metadata: https://www.npmjs.com/package/@ast-grep/napi
8. `@ast-grep/lang-csharp` package metadata: https://www.npmjs.com/package/@ast-grep/lang-csharp
9. Git `ls-files` documentation — tracked/untracked/cache enumeration behavior: https://git-scm.com/docs/git-ls-files

## Findings

### Inventory

`globby` fits Harnix better than hand-rolled recursive walking because it already covers glob expansion, ignore files, streams, and filesystem injection. The current major requires newer Node.js, so Harnix should pin the Node-18-compatible 14.x line and verify its transitive footprint and security during implementation.

Git enumeration can be faster and exact for tracked files, but it cannot be the primary contract: Harnix supports non-Git repositories, and requiring an executable would add platform/process complexity. It may be evaluated later as an optional parity-tested fast path.

### Retrieval

MiniSearch provides the needed local lexical candidate generation without a service, native binary, or runtime network. Harnix should own the final reranker rather than treating library relevance as product behavior. This makes package/language/task/path boosts explicit, testable, and stable across library upgrades.

The index should return candidates, not replace source reads. Agents should receive at most a small set of paths and structural outlines, then inspect current repository files directly.

### Structural extraction

ast-grep is capable, but its JavaScript NAPI package and dynamic language packages introduce native-prebuild, lifecycle, platform-matrix, and footprint considerations. The base JS API does not make every Harnix target language equally available without extra packages. It is therefore unsuitable as a required core dependency for the first repo-map version.

Lightweight conservative extraction is sufficient for the first version: filenames, packages, file kinds, headings, imports, and a bounded set of identifiers. AST adapters should be reconsidered only after golden-query results show a material gap.

### Storage and safety

Persisting full source or chunks would create privacy, secret, staleness, and footprint risks. The cache should contain normalized relative paths and compact derived structure only. It must exclude Harnix task/workspace data and secret-prone files, validate on load, serialize deterministically, and replace atomically.

## Conclusion

Recommend `globby@^14` for inventory and `MiniSearch` for lexical candidate retrieval, followed by a deterministic Harnix reranker. Use lightweight extractors in repo-map v1. Defer ast-grep or Tree-sitter-style native AST adapters until measured query-quality improvements justify their language packages, installation risk, and footprint.

Expose the capability only through hidden internal operations and workflow integration. Do not add a public command, require Git, perform network access, start a watcher, or let global prompt hooks build/write the cache.

## Remaining uncertainty

- Benchmarks must determine the final file, byte, concurrency, and cache-size defaults.
- Golden-query evaluation must establish whether language-neutral/lightweight extraction is adequate for C#, Python, Java, and Go repositories.
- A spike must compare rebuilding MiniSearch in memory with storing/loading its serialized representation.
- Security review must freeze the secret-prone path list and decide whether size/mtime fingerprints need periodic content-hash verification.
- Cross-platform package smoke must confirm the exact globby 14.x version and transitive dependency footprint before the dependency is accepted.
