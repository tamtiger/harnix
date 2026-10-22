# Relational database guide

## Verify

```text
<tool> migrate status
EXPLAIN <query>
```

## Constraints

- Wrap multi-statement changes in `BEGIN ... COMMIT` and know the engine's default isolation level.
- Guard read-then-write with `SELECT ... FOR UPDATE`, a conditional `UPDATE ... WHERE balance >= :amount` or a `version` column.
- Make no network calls inside an open transaction; chunk large batch mutations outside transactions.
- Lock rows and tables in fixed ascending key order (`Math.min(a, b)` before `Math.max(a, b)`); retry deadlocks with bounded backoff.
- Bind every value as a query parameter; never concatenate input into SQL.
- Declare `NOT NULL`, `FOREIGN KEY`, `UNIQUE` and `CHECK` constraints in the schema.
- Order composite indexes equality first, then sort or range; use partial/filtered indexes for soft-deleted sets (`deleted_at IS NULL`).
- Page with `ORDER BY <unique key> LIMIT n` and keyset `WHERE id > :last`, not large `OFFSET`.
- Migrate with expand and contract; test rollback scripts before deploy; build indexes online (`CONCURRENTLY` or online DDL).
- Test restores from backup on a schedule, including point-in-time recovery.

## Common mistakes

- Selecting `*` or querying inside application loops (N+1).
- Adding a `NOT NULL` column without default to a large table.
- Random UUIDv4 primary keys on large clustered tables; use sequential identity or UUIDv7.
- Oversized connection pools; size them to database CPU and I/O using `(2 * cores) + 1`.
