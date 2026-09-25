# PostgreSQL engineering guide

## MVCC internals, VACUUM tuning, and table bloat

- Understand PostgreSQL's Multi-Version Concurrency Control (MVCC) model: every `UPDATE` writes a new row version (tuple) and marks the old tuple dead; every `DELETE` marks the tuple dead without freeing physical disk space immediately. Dead tuples are cleaned up only by the `VACUUM` process.
- Configure autovacuum aggressively for write-heavy tables: adjust `autovacuum_vacuum_scale_factor` (e.g., from default 0.2 down to 0.05 or lower) and `autovacuum_vacuum_threshold` on high-churn tables to trigger vacuuming early and prevent catastrophic table and index bloat.
- Monitor long-running transactions and idle connections: open transactions (`IDLE in transaction`) hold back the database-wide transaction horizon (`xmin`), preventing autovacuum from cleaning dead tuples across all tables in the database. Enforce `idle_in_transaction_session_timeout` (e.g., 30s or 60s) to automatically terminate abandoned sessions.
- Monitor Transaction ID (XID) wraparound: ensure monitoring alerts fire well before the database reaches `autovacuum_freeze_max_age` (200 million transactions) to avoid emergency database read-only shutdowns.
- Avoid full table locks: use `pg_repack` to reclaim physical disk space and eliminate bloat on active live production tables without taking exclusive write table locks.

## Indexing strategies: B-Tree, GIN, GiST, and BRIN

- Create indexes on live production tables safely using `CREATE INDEX CONCURRENTLY`. Standard index creation acquires an exclusive table lock that blocks all concurrent writes; concurrent index creation runs in multiple passes without blocking ongoing OLTP operations.
- Leverage B-Tree indexes as the default for scalar equality and range lookups. Create Partial Indexes (`WHERE is_active = true AND deleted_at IS NULL`) for queries filtering on specific subsets of data to reduce index size and accelerate search performance.
- Use Generalized Inverted Indexes (GIN) for semi-structured `JSONB` document fields and full-text search columns. Utilize the jsonb path operator index (`jsonb_path_ops`) when queries primarily evaluate jsonb containment (`@>`), producing significantly smaller and faster GIN indexes.
- Apply Block Range Indexes (BRIN) on massive, naturally append-only or timestamp-ordered tables (e.g., telemetry, log records, timeseries data). BRIN indexes summarize data across page blocks, offering microscopic index sizes and lightning-fast scan speeds.
- Analyze index usage and query plans with `EXPLAIN (ANALYZE, BUFFERS)`. Regularly query the `pg_stat_user_indexes` catalog view to identify unused indexes and drop them to reclaim write I/O bandwidth.

## JSONB data modeling, concurrency, and advisory locks

- Model dynamic or polymorphic domain data using `JSONB` rather than raw text or unstructured strings. Enforce schema hygiene on critical JSONB attributes using table `CHECK` constraints (e.g., `CHECK (jsonb_typeof(metadata->'version') = 'number')`).
- Avoid treating PostgreSQL like a pure document database: keep core relational entities, foreign keys, and frequently queried financial values in standard typed relational columns; use JSONB only for open-ended metadata, tenant custom fields, or event payloads.
- Implement high-throughput, race-free job queues using pessimistic row locking with `SKIP LOCKED`:
  `SELECT id, payload FROM background_jobs WHERE status = 'pending' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1;`
  This enables multiple concurrent worker processes to pick and lock independent jobs simultaneously without contention or deadlocks.
- Leverage Application-level Advisory Locks (`pg_advisory_lock()`, `pg_try_advisory_xact_lock()`) for distributed coordination, singleton cron executions, and cross-application synchronization without requiring external coordination services like Redis or ZooKeeper.
- Enforce strict transaction isolation: understand that PostgreSQL's default `Read Committed` isolation level resolves row updates by re-evaluating the updated row, while `Repeatable Read` and `Serializable` throw serialization failures (`40001: could not serialize access`) that require application retry loops.

## Connection management, partitioning, and resilience

- Never expose PostgreSQL directly to thousands of application threads or serverless Lambdas with high `max_connections`. Sizing PostgreSQL's `max_connections` beyond a few hundred creates massive OS context switching and memory overhead.
- Deploy PgBouncer or an equivalent lightweight connection pooler in front of PostgreSQL using `transaction` pooling mode for stateless web microservices, and size application-side pools conservatively based on physical CPU cores.
- Partition massive tables (tables exceeding hundreds of gigabytes or tens of millions of rows) using Declarative Table Partitioning by range (e.g., monthly time ranges) or by list (e.g., by tenant region). Ensure queries include the partition key in their `WHERE` clause to enable Partition Pruning and avoid scanning unnecessary partition tables.
- Safeguard against runaway queries: configure `statement_timeout` on application user roles (e.g., 15s for web endpoints, 60s for batch processing) to automatically kill frozen queries before they degrade database cluster performance.
- Implement reliable backup and replication architectures: configure Physical Streaming Replication with read-only standbys for read scaling and failover, and utilize continuous archiving with tools like pgBackRest or WAL-G for verifiable Point-in-Time Recovery (PITR).
