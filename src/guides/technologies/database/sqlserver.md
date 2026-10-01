# SQL Server guide

## Verify

```text
sqlcmd -Q "SELECT session_id, status, blocking_session_id, wait_type, command FROM sys.dm_exec_requests WHERE session_id > 50"
sqlcmd -Q "SELECT name, is_read_committed_snapshot_on, is_auto_update_stats_async_on FROM sys.databases"
sqlcmd -Q "SELECT TOP 10 * FROM sys.dm_db_missing_index_details"
sqlcmd -Q "SELECT * FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED')"
sqlcmd -Q "SET STATISTICS IO, TIME ON; <query>"
sqlcmd -Q "RESTORE VERIFYONLY FROM DISK = N'<backup file>'"
```

## Constraints

- Run `DBCC CHECKDB` only on a restored copy or off-peak.
- Enable `READ_COMMITTED_SNAPSHOT` with `ALTER DATABASE ... SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE` to stop readers blocking writers; watch `tempdb` version store size.
- Ban `NOLOCK` / `READUNCOMMITTED` in business queries; it returns dirty, duplicated or skipped rows.
- Use `SET XACT_ABORT ON` in every procedure with a transaction.
- Batch large writes (for example `TOP (2000)` per loop) to stay below the roughly 5,000-lock escalation threshold.
- Give each table a narrow clustered key (`BIGINT IDENTITY` or `NEWSEQUENTIALID()`).
- Use `INCLUDE` columns and filtered indexes to remove key lookups; check plans or Query Store for lookups and `tempdb` spills.
- Execute dynamic SQL only through `sp_executesql` with typed parameters.
- Use `TRY...CATCH` with `THROW`, not `RAISERROR`; capture deadlock graphs via Extended Events `xml_deadlock_report`.
- Keep `AUTO_UPDATE_STATISTICS` on; use several equal-sized `tempdb` data files (up to 8).

## Common mistakes

- Sniffing a bad plan, then masking it with `OPTION (RECOMPILE)` everywhere instead of fixing the cause.
- Implicit conversions (`NVARCHAR` vs `VARCHAR` parameter) that turn seeks into scans.
- Using `OFFSET ... FETCH` with deep pages instead of keyset pagination.
- Shrinking database files on a schedule, which fragments indexes.
- Full recovery model without regular log backups, so the log grows unbounded.
