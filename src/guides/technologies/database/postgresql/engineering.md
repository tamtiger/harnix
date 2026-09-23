# PostgreSQL engineering guide

## MVCC and vacuum

- PostgreSQL keeps old row versions until vacuum reclaims them. A long-running transaction, even a read-only one, prevents vacuum from cleaning up dead rows across the whole database, not only its own table.
- Watch transaction ID wraparound risk on old, write-heavy tables. Autovacuum exists specifically to prevent it, so do not disable autovacuum globally to reduce load without a deliberate replacement plan.
- Confirm a query plan against representative data before trusting it. The planner's row estimates depend on statistics that go stale after a large bulk write, until the next analyze runs.

## Indexing choices

- Reach for a B-tree index by default. Use a GIN index for full-text search and array or JSON containment queries, and a partial index when only a known subset of rows is ever queried.
- A JSON column defers shape validation to the application. Choose it deliberately for genuinely dynamic structure, not as a way to skip writing a migration.
- Order composite index columns by the query's equality predicates first, then its range predicates, matching how the query actually filters rather than the order columns happen to appear in the table.

## Extensions and operational specifics

- Prefer a well-known, maintained extension over a custom equivalent when one already ships with the engine, and pin the extension version alongside the migration that enables it.
- Logical replication and physical replication solve different problems. Know which one a given need — cross-version upgrade, selective table sync, failover — actually requires.
- Memory and connection configuration knobs interact with each other and with the host's real resources. Tune from measured behavior under representative load, not from a generic checklist.
- A high connection count from many short-lived application processes exhausts the server faster than the workload itself would; place a pooler in front of the database when the connection model does not already manage this.
