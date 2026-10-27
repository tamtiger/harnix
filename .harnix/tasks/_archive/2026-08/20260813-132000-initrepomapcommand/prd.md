# Repository map initialization and short query command

Fresh `harnix init` creates `.harnix/cache/repo-map-v1.json` after the project config and managed files are successfully written. `--dry-run` reports the cache as planned but writes nothing. An already initialized project remains a no-op and does not refresh its cache.

`harnix repo-map --query <text> [--limit <count>]` is a public command that always emits JSON. It is read-only, requires an initialized project and existing valid cache, defaults to 20 results, accepts only limits 1–20, and uses the same bounded retrieval/reranking as the compatible hidden internal query. The cache is refreshed with init, hidden `harnix internal repo-map refresh`, or `harnix doctor --fix`; platform hooks never invoke it.

No raw source, literal, secret, absolute path, daemon, embedding, or network behavior is added.
