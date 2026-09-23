# Redis engineering guide

## Data model and key design

- Choose Redis's data structures deliberately: a hash for a record with several fields, a sorted set for a ranked or time-ordered feed, a list for a bounded queue, a set for membership. Reaching for a plain string plus ad hoc serialization gives up structure the server could otherwise enforce and query for you.
- Design keys with a stable, greppable naming convention so a key-pattern scan stays cheap and predictable as the keyspace grows.
- Avoid an unbounded collection under a single key. A list, set, or hash that grows without limit degrades every operation on that key and risks one oversized value.

## TTL, eviction, and cache correctness

- Set an explicit expiration on anything that is a cache rather than a system of record, and know the configured eviction policy, because it decides what happens when memory pressure hits.
- Treat cache invalidation as part of the write path: when the source of truth changes, invalidate or update the cached value in the same operation, not as an afterthought that leaves stale data behind indefinitely.
- Guard against a cache stampede, where many callers recompute the same expensive value at once after a shared key expires, with a lock, a probabilistic early refresh, or a short negative-cache entry rather than assuming low traffic makes it unlikely.

## Persistence and durability

- Redis persistence is a durability trade-off the application must choose deliberately. A pure cache workload may need none of it, while Redis used as a system of record needs a clear, tested recovery story.
- Do not use Redis as the sole system of record for data the business cannot afford to lose without an explicit, tested persistence and backup configuration; understand exactly what data-loss window the chosen persistence mode allows.
- Batch a sequence of independent commands into a single round trip instead of issuing them one at a time, and reserve an atomic multi-command block for operations that genuinely must execute together, not as a default wrapper.

## Operations

- Watch memory usage against the configured limit, and choose an eviction policy that matches the workload; evicting the wrong keys under pressure can be as harmful as no eviction at all.
- A single expensive command — an unbounded key scan, a large sort, a big aggregation — blocks the single-threaded command loop for every other client. Use an incremental scan instead of a blocking full-keyspace command, and move expensive computation off the hot path.
- Understand the failover behavior of the sentinel or cluster mode in use, including what happens to in-flight commands and any window where a write can be lost during failover.
