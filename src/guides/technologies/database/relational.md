# Relational database engineering guide

## Transactions, isolation levels, and concurrency control

- Make every multi-statement mutation atomic: wrap cohesive business changes within explicit transaction boundaries (`BEGIN ... COMMIT / ROLLBACK`). Understand the default transaction isolation level of your specific RDBMS (typically Read Committed or Repeatable Read) and design for the concurrency anomalies permitted under that level (non-repeatable reads, phantom reads, or serialization write skew).
- Prevent race conditions during concurrent mutations: treat every read-then-write sequence as an active race unless protected atomically. Use pessimistic locking (`SELECT ... FOR UPDATE`), atomic conditional updates (`UPDATE ... SET balance = balance - :amount WHERE id = :id AND balance >= :amount`), or optimistic concurrency with an incremental version column (`WHERE id = :id AND version = :version`).
- Keep transaction durations minimal: never execute external network calls, third-party API requests, file uploads, or slow background processing inside an open database transaction. Long-running transactions hold locks, exhaust connection pools, bloat undo/WAL logs, and cause cascading database-wide blocking.
- Acquire locks in a consistent, deterministic order across all application code paths to prevent circular transaction deadlocks. Handle transient deadlock exceptions gracefully by implementing bounded exponential backoff retries.
- Isolate reporting and analytics queries: execute read-heavy reporting jobs on read-only replicas or using snapshot/read-uncommitted isolation to avoid acquiring shared read locks that block concurrent OLTP writes.

## Schema design, integrity constraints, and indexing strategy

- Enforce domain invariants directly in the database engine: use explicit `NOT NULL` constraints, foreign keys with intentional cascade policies (`ON DELETE RESTRICT` or `CASCADE`), `UNIQUE` constraints, and table `CHECK` constraints. Never rely purely on application code to enforce fundamental data integrity.
- Design indexes as part of the query contract: analyze the cardinality and filtering predicates of queries. Create composite indexes where column order matches query patterns: equality columns first, followed by range or sort columns (`WHERE tenant_id = :t AND status = :s ORDER BY created_at DESC`).
- Leverage covering indexes: include frequently selected projection columns in the index (e.g., using `INCLUDE (...)` where supported) to satisfy queries directly from index pages via Index-Only Scans, eliminating expensive table heap lookups.
- Avoid over-indexing: every additional index accelerates specific queries but degrades write throughput (INSERT, UPDATE, DELETE) and increases storage and buffer cache memory consumption. Audit and drop unused or redundant indexes periodically.
- Choose primary keys deliberately: prefer sequential, collision-resistant 64-bit integers (`BIGINT IDENTITY/AUTO_INCREMENT`) or time-ordered UUIDs (UUIDv7) to prevent index page fragmentation and high random I/O write penalties associated with random UUIDv4 keys.

## Query discipline, pagination, and execution analysis

- Always parameterize SQL queries: bind all user inputs and external values through driver prepared statements. Never concatenate untrusted strings into query text under any circumstance, as concatenation is the root cause of SQL injection vulnerabilities.
- Eliminate the N+1 query anti-pattern: avoid issuing database queries inside application loops. Eager-load relational associations in batches using explicit SQL joins, subqueries, or multi-key `IN (...)` lookups.
- Enforce strict query bounds and deterministic sorting: never execute unbounded `SELECT *` queries in production. Always project only necessary columns and pair `LIMIT` clauses with explicit, unique `ORDER BY` clauses to guarantee stable pagination results.
- Implement keyset pagination (cursor-based pagination) using indexed columns (`WHERE id > :last_seen_id ORDER BY id ASC LIMIT 20`) for large, frequently scrolled datasets. Avoid high-offset pagination (`OFFSET 100000`), as the database must read and discard all preceding rows.
- Regularly inspect query execution plans using `EXPLAIN ANALYZE` or database execution plan tools. Identify and resolve sequential table scans, high disk read spills, and hash join memory bottlenecks before deploying queries to production.

## Connection pooling, migration safety, and resilience

- Manage database connections using robust connection pools (e.g., HikariCP, PgBouncer, or built-in ORM pools). Size pool capacity based on the database engine's physical CPU and I/O capacity rather than anticipated concurrent web requests. An oversized connection pool causes CPU context-switching thrashing and degrades overall throughput.
- Enforce connection pool hygiene: configure short connection acquisition timeouts, explicit max lifetime boundaries (`maxLifetime` shorter than firewall idle connection drops), and validate connections with lightweight health test queries before use.
- Practice zero-downtime database migrations using the Expand-and-Contract (Parallel Run) pattern: add new columns or tables as optional/nullable first, update application code to write to both old and new structures, backfill historical data in small batches, switch read traffic to the new structure, and finally drop deprecated columns in a subsequent deployment.
- Never execute table-locking DDL operations (such as adding non-null columns without defaults or building indexes synchronously) on large production tables during peak traffic hours; utilize online DDL mechanisms (`CONCURRENTLY` or online schema change tools like gh-ost/pt-online-schema-change).
- Test disaster recovery procedures: automate regular automated full and Point-in-Time Recovery (PITR) backups, store backups in geographically redundant storage, and regularly rehearse database restore drills to verify Mean Time to Recovery (MTTR) objectives.
