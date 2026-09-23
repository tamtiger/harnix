# SQL Server engineering guide

## Locking and isolation

- The default read-committed isolation still takes shared locks unless snapshot isolation is enabled for the database. Know whether that setting is on, because it changes whether readers block writers.
- Lock escalation from row or page locks to a table lock happens automatically under memory pressure or a large scan. A bulk operation that looked fine in testing can escalate and block unrelated queries under production volume.
- Use an explicit locking hint or the right isolation level for a read-then-write sequence that must not race, rather than assuming the default isolation level protects it.

## Indexing and query specifics

- A clustered index defines physical row order; choose it deliberately, usually a narrow and ever-increasing key, because every nonclustered index carries the clustered key as its row locator.
- Parameter sniffing means a cached plan optimized for one parameter value can perform badly for another. Rule this out before assuming a slow query is purely a missing-index problem.
- Compare actual execution plans, not estimated ones, against representative data, and recompile a plan deliberately once the underlying data distribution has changed materially.

## Schema evolution and operations

- Prefer an online schema-change approach for a busy table during a migration, and confirm the edition and version in use actually support the online operation being planned.
- High-availability and log-shipping approaches solve different failover needs; choose based on the actual recovery-time and recovery-point objectives, not on which is easiest to set up.
- Prefer native backup and restore, and verify the restore path with an actual rehearsed restore rather than trusting an untested backup job.
- Review query store or an equivalent captured-plan history after a version upgrade or a statistics update, since the optimizer can pick a materially different plan for the same query once the underlying model changes.
