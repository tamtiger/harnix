# Redis guide

## Verify

```text
redis-cli --scan --pattern '<prefix>*'
redis-cli --latency
redis-cli INFO memory
redis-cli CONFIG GET maxmemory-policy
```

## Constraints

- Never run `KEYS`; iterate with `SCAN ... COUNT`.
- Set `maxmemory` and `maxmemory-policy` (`allkeys-lru` for caches, `volatile-lru` for mixed data).
- Give every cache key a TTL (`SET key value EX <seconds>`) and add random jitter to avoid mass expiry.
- Name keys `app:<env>:<entity>:<id>`.
- Take locks with `SET key token NX PX <ms>` and release them with a Lua script that checks the token before `DEL`.
- Use `MULTI`/`EXEC` with `WATCH` or Lua/`FUNCTION LOAD` for read-modify-write; keep scripts short.
- Cache null sentinels with a short TTL for missing ids.
- Use Streams with `XREADGROUP` and `XACK` for durable queues.
- Persist with RDB plus AOF `appendfsync everysec` when data loss matters.
- Use hash tags such as `{user:1}:orders` for multi-key operations in Cluster.

## Common mistakes

- Storing large values or unbounded lists, sets or hashes.
- Using Pub/Sub where messages must survive a disconnect.
- Releasing a lock with a bare `DEL`.
- Blocking commands (`BLPOP`) on a shared pooled connection.
