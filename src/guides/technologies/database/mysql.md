# MySQL guide

## Verify

```text
mysql -e "EXPLAIN ANALYZE <query>"
mysql -e "EXPLAIN FORMAT=JSON <query>"
mysql -e "SHOW ENGINE INNODB STATUS\G"
mysql -e "SHOW FULL PROCESSLIST"
mysql -e "SELECT * FROM performance_schema.data_lock_waits"
mysql -e "SHOW VARIABLES LIKE 'transaction_isolation'"
```

## Constraints

- Use InnoDB for every table; reject MyISAM.
- Use a small sequential primary key (`BIGINT AUTO_INCREMENT` or time-ordered UUID); every secondary index stores the PK, so wide or random keys bloat them.
- Order composite indexes by the leftmost-prefix rule; confirm in `EXPLAIN` that `type` is not `ALL` and there is no `Using filesort` or `Using temporary` on hot queries.
- Set `innodb_buffer_pool_size` to roughly 60-80% of RAM on a dedicated server.
- Keep `innodb_flush_log_at_trx_commit = 1` and `sync_binlog = 1` where durability matters.
- Under default Repeatable Read, gap and next-key locks cause contention; consider `READ-COMMITTED` with `binlog_format = ROW`.
- Retry on error 1213 (deadlock) and 1205 (lock wait timeout); tune `innodb_lock_wait_timeout`.
- Enable GTID (`gtid_mode = ON`, `enforce_gtid_consistency = ON`) for replication.
- Specify `ALGORITHM=INSTANT` or `ALGORITHM=INPLACE, LOCK=NONE` explicitly so DDL fails instead of silently locking; use `gh-ost` or `pt-online-schema-change` otherwise.
- Set `wait_timeout` and `max_connections` to match memory and pool size.

## Common mistakes

- Using `utf8` (3-byte `utf8mb3`) instead of `utf8mb4`.
- Relying on implicit `ORDER BY` after `GROUP BY` or on unspecified row order.
- Deep `LIMIT offset, n` pagination instead of keyset pagination.
- Comparing columns of differing charset or collation, or a string column to a number, which disables the index.
- Treating `mysqldump` as a verified backup without a test restore.
