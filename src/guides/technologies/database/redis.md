# Redis engineering guide

## Data structures, modeling discipline, and memory management

- Standardize on modern Redis versions (Redis 7.0 or Redis 7.2+). Select native data structures aligned strictly with domain access patterns:
  - **Strings**: Use for scalar cache values, serialized JSON payloads, atomic counters (`INCR`, `DECRBY`), and bit arrays (`SETBIT`, `GETBIT`).
  - **Hashes**: Use for representing domain objects and user profiles with individual field access (`HGET`, `HSET`, `HINCRBY`), reducing JSON serialization overhead and saving memory via ziplist/listpack encoding.
  - **Lists**: Use for fixed-size audit trails (`LPUSH`, `LTRIM`), bounded timelines, and simple worker queues (`BLPOP`, `RPUSH`).
  - **Sets & Sorted Sets (ZSets)**: Use Sets for unique memberships and tagging (`SADD`, `SISMEMBER`, `SINTER`); use Sorted Sets for score-based ranking, leaderboards, priority queues, and time-window rate limiters (`ZADD`, `ZRANGEBYSCORE`, `ZREMRANGEBYSCORE`).
  - **Streams**: Use for durable, multi-consumer event streaming, append-only message logs, and distributed pub/sub with consumer groups (`XADD`, `XREADGROUP`, `XACK`).
- Structure key namespaces logically using colon delimiters: `app:<environment>:<entity>:<identifier>:<attribute>` (e.g., `app:prod:users:1042:profile`). Keep key names descriptive yet compact to conserve precious RAM.
- Always configure an explicit memory limit (`maxmemory`) and appropriate eviction policy (`maxmemory-policy`):
  - Use `volatile-lru` or `volatile-lfu` if Redis stores a hybrid mix of persistent state and ephemeral caches with explicit TTLs.
  - Use `allkeys-lru` or `allkeys-lfu` for pure caching layers to automatically evict the least frequently/recently used keys when memory saturates.
  - Never run production Redis without a configured `maxmemory` limit, or the operating system Out-Of-Memory (OOM) killer will terminate the Redis process unexpectedly.
- Monitor memory consumption continuously using `INFO memory`: watch `used_memory_rss` vs `used_memory` (Memory Fragmentation Ratio). When fragmentation exceeds 1.5, enable Active Defragmentation (`activedefrag yes`).

## Caching patterns, Cache stampede mitigation, and TTL discipline

- Always set an explicit Time-To-Live (TTL) on all cached entries using `EXPIRE` or `SET ... EX <seconds>`. Never write indefinite cache entries without a deterministic eviction or invalidation trigger; unbounded indefinite keys are the leading cause of memory leaks in Redis.
- Implement the Cache-Aside (Lazy Loading) pattern: application code reads from Redis first; on cache miss, query the primary database, write the result to Redis with a TTL, and return data to the caller.
- Mitigate Cache Stampede (Thundering Herd problem): when a hot cache key expires, thousands of concurrent requests can simultaneously hit the primary database, causing catastrophic database failure. Prevent stampedes using:
  - **Probabilistic Early Expiration (XFetch)** or adding random expiration jitter (e.g., `TTL = base_seconds + random_jitter`) to prevent bulk key expirations at the same exact second.
  - **Distributed Mutex / SingleFlight**: acquire a lightweight Redis lock (`SET lock:key token NX EX 5`) on cache miss; only the single lock winner queries the primary database and refreshes the cache, while other callers wait briefly or return slightly stale cached data.
- Defend against Cache Penetration (queries for non-existent IDs hitting the database continuously): cache null or sentinel values (`SET key "NULL" EX 60`) for short durations, or deploy a Bloom Filter (`BF.ADD`, `BF.EXISTS` via RedisBloom) in front of the cache layer.
- Prevent Cache Avalanche: stagger TTL values across data batches to ensure millions of keys do not expire simultaneously during scheduled refresh events.

## Atomicity, Lua scripting, and Redis Functions

- Guarantee multi-step atomicity using native Redis Transactions (`MULTI` / `EXEC` with `WATCH`) or Lua scripts (`EVAL` / `EVALSHA`). Lua scripts execute atomically in Redis: no other command can execute while a script runs, eliminating race conditions during complex read-modify-write workflows.
- Standardize on Redis Functions (`FUNCTION LOAD`) on Redis 7+: Redis Functions persist in the database, replicate automatically across cluster replicas, and provide clear modularity over ad-hoc raw Lua script strings.
- Keep Lua scripts and Redis Functions fast and computational-only: never perform heavy loops or long-running computations inside a Lua script. Because Redis is primarily single-threaded for command execution, a slow script blocks all other clients and triggers client timeouts.
- Implement distributed locking safely using Redlock principles or atomic token scripts:
  Acquire locks using `SET lock_key unique_token NX PX 10000`. Release locks strictly via a Lua script that verifies the token matches before calling `DEL`, ensuring a slow process never accidentally releases a lock acquired by another concurrent process.
- Implement token-bucket and sliding-window rate limiters using Sorted Sets or Redis Functions to protect downstream APIs from abusive request bursts.

## Resilience, replication, and cluster architecture

- Never use the blocking `KEYS *` command in production under any circumstance! `KEYS` scans the entire keyspace synchronously, freezing the Redis server for seconds or minutes. Always use `SCAN` with `COUNT` for iterative cursor-based key traversals in administrative scripts.
- Choose appropriate persistence modes aligned with durability needs:
  - Combine RDB (Redis Database snapshots) for fast point-in-time recovery and automated backups with AOF (Append Only File) configured with `appendfsync everysec` for minimal data loss (at most 1 second of transactions).
- Deploy Redis Sentinel for high availability and automatic failover in small to medium deployments (1 Primary with 2+ Replicas and 3 Sentinel nodes).
- Scale out throughput and memory capacity horizontally using Redis Cluster for large datasets (>25GB RAM or >100,000 ops/sec). Ensure multi-key commands and Lua scripts use Hash Tags (e.g., `{user:1042}:orders`, `{user:1042}:profile`) to guarantee related keys map to the exact same cluster hash slot.
- Manage client connections defensively: use connection pooling with short connect and read timeouts, and enable client-side caching (Tracking / RESP3 protocol) for ultra-hot read-only configuration data to bypass network round-trips entirely.
