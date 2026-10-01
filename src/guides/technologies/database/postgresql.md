# PostgreSQL guide

## Verify

```text
pg_isready
psql -c "EXPLAIN (ANALYZE, BUFFERS) <query>"
psql -c "SELECT pid, state, xact_start, query FROM pg_stat_activity WHERE state <> 'idle'"
psql -c "SELECT relname, n_dead_tup, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10"
psql -c "SELECT relname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0"
psql -c "SELECT datname, age(datfrozenxid) FROM pg_database"
```

## Constraints

- Create or drop indexes on live tables with `CREATE INDEX CONCURRENTLY` / `DROP INDEX CONCURRENTLY`, outside a transaction block; drop any `INVALID` index left by a failure.
- Set `lock_timeout` before DDL so a blocked `ALTER TABLE` does not queue all traffic behind it.
- Set `idle_in_transaction_session_timeout` and role-level `statement_timeout`; idle transactions hold back the `xmin` horizon and block vacuum.
- Lower `autovacuum_vacuum_scale_factor` per high-churn table with `ALTER TABLE ... SET (...)` instead of globally.
- Alert on `age(datfrozenxid)` well before `autovacuum_freeze_max_age` to avoid XID wraparound.
- Dequeue jobs with `SELECT ... FOR UPDATE SKIP LOCKED`; use `pg_try_advisory_xact_lock` for singleton work.
- Use `jsonb_path_ops` GIN indexes for `@>` containment queries; keep core relational columns typed, not in `jsonb`.
- Use BRIN on append-only, time-ordered tables and partial indexes for filtered subsets.
- Route apps through PgBouncer in transaction pooling mode; do not raise `max_connections` into the thousands.
- Retry on SQLSTATE `40001` and `40P01` under Repeatable Read, Serializable and deadlocks.

## Common mistakes

- Adding a column with a volatile default or a type change on a big table, which rewrites it.
- Running `VACUUM FULL` on a live table; it takes an `ACCESS EXCLUSIVE` lock (use `pg_repack`).
- Assuming `NOT NULL` or `CHECK` is cheap to add; use `NOT VALID` then `VALIDATE CONSTRAINT`.
- Partitioned queries without the partition key in `WHERE`, so pruning never happens.
- Unindexed foreign key columns, which make parent deletes scan the child table.
- Trusting a plan from `EXPLAIN` alone when `EXPLAIN ANALYZE` was needed.
