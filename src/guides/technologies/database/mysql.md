# MySQL engineering guide

## InnoDB storage engine architecture and primary key design

- Standardize on modern MySQL versions (MySQL 8.0+ or MySQL 8.4 LTS). Use the InnoDB storage engine exclusively for all tables; never use deprecated legacy engines like MyISAM.
- Understand InnoDB's Clustered Index architecture: table rows are stored physically ordered by the Primary Key. Choose an incremental, sequential integer primary key (`BIGINT AUTO_INCREMENT`) or time-ordered UUIDv7. Avoid random UUIDv4 primary keys, which cause frequent B-tree page splits, severe disk fragmentation, and high random I/O write amplification.
- Keep primary key sizes small: in InnoDB, every secondary index stores the primary key value as its leaf node pointer. A wide primary key (e.g., long composite strings) bloats every secondary index on the table and consumes valuable InnoDB Buffer Pool memory.
- Tune the InnoDB Buffer Pool properly: configure `innodb_buffer_pool_size` to 60–80% of total physical RAM on dedicated database servers. Set `innodb_buffer_pool_instances` (e.g., 8 or 16) to reduce buffer pool mutex contention under high concurrent multi-threaded workloads.
- Configure durable redo log flush behavior: set `innodb_flush_log_at_trx_commit = 1` and `sync_binlog = 1` for mission-critical ACID transactional guarantees, ensuring data survives unexpected OS crashes or power failures without corruption.

## Indexing, query optimization, and execution analysis

- Design secondary indexes around query filtering and sorting patterns: follow the Leftmost Prefix Rule for composite indexes (`INDEX (tenant_id, status, created_at)`). A query filtering on `status` without `tenant_id` cannot utilize this composite index efficiently.
- Maximize Index Condition Pushdown (ICP): ensure MySQL pushes `WHERE` condition evaluations down to the storage engine level during index scans, reducing the number of row records the engine must retrieve from the clustered index table.
- Eliminate filesort and temporary table operations on disk: inspect query execution plans using `EXPLAIN FORMAT=JSON` or `EXPLAIN ANALYZE` (MySQL 8.0+). Pay critical attention to `"type": "ALL"` (full table scans), `"Using filesort"`, and `"Using temporary"` on high-frequency OLTP queries.
- Optimize pagination for large tables: avoid high-offset pagination (`LIMIT 100000, 20`), which forces InnoDB to scan and discard 100,000 index entries. Use keyset/cursor pagination (`WHERE id > :last_id ORDER BY id ASC LIMIT 20`) or deferred join pagination (`JOIN (SELECT id FROM ... LIMIT 100000, 20) ...`).
- Enable and monitor the Slow Query Log: configure `slow_query_log = 1`, `long_query_time = 0.5` (or lower), and `log_queries_not_using_indexes = 1` in development and staging environments to proactively detect unindexed queries before they cause production incidents.

## Concurrency, locking, and deadlock mitigation

- Master InnoDB locking mechanics: InnoDB uses Record Locks, Gap Locks, and Next-Key Locks (combination of record and gap locks) to prevent phantom rows under the default `Repeatable Read` isolation level.
- Prevent gap lock contention and deadlocks: when building high-concurrency microservices, consider switching the transaction isolation level to `Read Committed` (`transaction_isolation = 'READ-COMMITTED'`) and setting binary log format to `binlog_format = ROW`. Under Read Committed, InnoDB eliminates gap locking for normal search queries, drastically reducing lock contention and transaction deadlocks.
- Acquire locks deterministically: ensure all transactions that update multiple rows sort the row IDs in identical order before executing `SELECT ... FOR UPDATE` or `UPDATE` statements to avoid classic cyclic deadlocks.
- Keep transaction execution windows brief: never wait for network responses or perform complex client-side calculations while holding open InnoDB row locks.
- Handle deadlocks gracefully in application logic: configure `innodb_lock_wait_timeout` (e.g., 5s to 10s for OLTP) and catch MySQL error code 1213 (ER_LOCK_DEADLOCK) to automatically retry the transaction using exponential backoff with jitter.

## High availability, replication, and online schema changes

- Configure asynchronous or semi-synchronous replication with Global Transaction Identifiers (GTID) enabled (`gtid_mode = ON`, `enforce_gtid_consistency = ON`). GTID ensures error-free failover and replication topology restructuring without manual binary log coordinate tracking.
- Distribute read-heavy traffic across MySQL read replicas using connection routers (such as ProxySQL or AWS Aurora Reader Endpoints) while routing all write transactions strictly to the primary writer instance.
- Execute large table schema migrations safely: while MySQL 8.0 supports Instant DDL for adding columns or dropping virtual columns, complex alterations (e.g., modifying column data types or rebuilding large tables) still take exclusive metadata locks. Use proven asynchronous online schema change tools like `gh-ost` or `pt-online-schema-change` for multi-gigabyte production tables.
- Safeguard against connection exhaustion: configure `max_connections` aligned with memory limits, and set `wait_timeout` and `interactive_timeout` to kill orphaned or leaked application connections.
- Implement comprehensive backup strategies: perform regular physical hot backups using Percona XtraBackup or MySQL Enterprise Backup alongside logical exports with `mysqldump` / `mysqlpump`, and routinely verify backup integrity through automated restore rehearsal pipelines.
