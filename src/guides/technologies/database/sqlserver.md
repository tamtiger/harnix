# SQL Server engineering guide

## Storage engine internals, clustered indexes, and concurrency isolation

- Standardize on modern SQL Server versions (SQL Server 2019 or SQL Server 2022+). Design database tables with an explicit, narrow Clustered Index (typically on a sequential `BIGINT IDENTITY` or sequential GUID via `NEWSEQUENTIALID()`). In SQL Server, the clustered index is the table itself; rows are physically sorted by the clustered index key.
- Eliminate writer-reader blocking by enabling Read Committed Snapshot Isolation (RCSI):
  `ALTER DATABASE [YourDb] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;`
  RCSI uses row versioning in `tempdb` to satisfy read queries without acquiring shared locks (`S` locks), allowing readers to read unblocked while writers update rows, dramatically reducing concurrency deadlocks in high-throughput enterprise applications.
- Understand transaction isolation levels: avoid using the dangerous `NOLOCK` (`READUNCOMMITTED`) query hint in business transactions. `NOLOCK` allows reading dirty, uncommitted rows, duplicated rows, and skipped rows caused by concurrent B-tree page splits.
- Prevent lock escalation: when queries mutate or scan more than 5,000 rows in a single table, SQL Server may escalate fine-grained row/page locks to an exclusive table lock (`X` lock). Keep batch updates bounded (e.g., updating in batches of 1,000 to 4,000 rows using `TOP (2000)`) or configure `ALTER TABLE ... SET (LOCK_ESCALATION = AUTO)` on partitioned tables.
- Keep transaction scopes small and deterministic: wrap multi-statement writes in `BEGIN TRANSACTION ... COMMIT TRANSACTION` blocks with explicit `XACT_ABORT ON` to ensure unhandled errors automatically roll back the transaction cleanly.

## Indexing strategies, Columnstore, and execution analysis

- Leverage Non-Clustered Indexes with Included Columns (`CREATE NONCLUSTERED INDEX ... ON Table(Col1, Col2) INCLUDE (Col3, Col4)`). Adding frequently projected query columns to the leaf-level `INCLUDE` clause satisfies queries via Index-Only Covering Scans without traversing back to the clustered index via costly Key Lookups.
- Use Filtered Indexes (`WHERE IsActive = 1 AND DeletedAt IS NULL`) to index only relevant rows, reducing index storage overhead and accelerating search queries over sparse subsets of table data.
- Optimize analytics and reporting workloads using Clustered Columnstore Indexes. Columnstore indexes compress data column-wise up to 10x and leverage vectorized batch-mode processing to accelerate large aggregation and grouping queries by orders of magnitude over row-store tables.
- Analyze query execution plans and resource bottlenecks using Graphical Execution Plans or Query Store. Pay close attention to expensive operations: Clustered Index Scans on large tables, Key Lookups, and Spills to `tempdb` caused by inaccurate memory grant estimations.
- Maintain index health and statistics: configure automated index reorganization and rebuilding jobs for tables with high fragmentation (>30%), and ensure `AUTO_UPDATE_STATISTICS` is enabled with `AUTO_UPDATE_STATISTICS_ASYNC ON` to prevent query plan degradation from stale statistics.

## Query discipline, stored procedures, and error handling

- Always parameterize T-SQL queries: execute dynamic SQL strictly via `sp_executesql` with typed parameter definitions (`@stmt, @params, @param1 = val1`). Never concatenate untrusted strings into T-SQL execution blocks, as this opens severe SQL injection vulnerabilities and causes excessive plan cache pollution.
- Avoid scalar user-defined functions (UDFs) in `WHERE` and `SELECT` clauses when running on versions older than SQL Server 2019, as scalar UDFs historically forced single-threaded row-by-row execution (RBAR). Use inline table-valued functions (iTVFs) or modern Scalar UDF Inlining (SQL Server 2019+).
- Implement robust T-SQL error handling using structured `TRY...CATCH` blocks:
  Capture `ERROR_NUMBER()`, `ERROR_MESSAGE()`, `ERROR_SEVERITY()`, and `ERROR_LINE()`. Re-throw errors using `THROW` instead of legacy `RAISERROR` to preserve line numbers and execution call stacks.
- Prevent parameter sniffing issues: if a stored procedure experiences erratic execution speeds based on parameter values, inspect plan variability and apply query hints (`OPTION (RECOMPILE)` or `OPTION (OPTIMIZE FOR (@Param = ...))`) judiciously.
- Implement keyset pagination using `OFFSET ... ROWS FETCH NEXT ... ROWS ONLY` paired with a unique, indexed `ORDER BY` clause. Ensure pagination queries are backed by an index matching the sort order to prevent expensive sorting in `tempdb`.

## High availability, tempdb tuning, and disaster recovery

- Configure AlwaysOn Availability Groups (AG) for mission-critical enterprise high availability and disaster recovery. Configure synchronous replication with automatic failover for high-availability secondary replicas within the same data center, and asynchronous replication for offsite disaster recovery instances.
- Route read-only reporting queries to readable secondary replicas using Read-Only Routing (`ApplicationIntent=ReadOnly` in connection strings) to offload reporting overhead from the primary read-write replica.
- Optimize `tempdb` configuration: place `tempdb` data files on ultra-fast NVMe storage, and pre-allocate multiple `tempdb` data files of identical size matching the number of logical CPU cores (up to 8 files) to eliminate Page Free Space (PFS) and Shared Global Allocation Map (SGAM) page allocation contention.
- Monitor database performance and deadlocks continuously using Extended Events (XEvents) instead of legacy SQL Server Profiler / SQL Trace. Capture deadlock graphs (`xml_deadlock_report`) automatically to identify competing queries, object resources, and lock modes.
- Implement comprehensive backup strategies: schedule weekly Full backups, daily Differential backups, and frequent Transaction Log backups (e.g., every 5 to 15 minutes) under the Full Recovery Model to maintain Point-in-Time Recovery (PITR) guarantees, and routinely test backup validation via `RESTORE VERIFYONLY` and test restores.
