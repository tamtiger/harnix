# Relational database guide

## Verify

```text
<tool> migrate status
EXPLAIN <query>
```

## Constraints

- Wrap multi-statement changes in `BEGIN ... COMMIT` and know the engine's default isolation level.
- Guard read-then-write with `SELECT ... FOR UPDATE`, a conditional `UPDATE ... WHERE balance >= :amount` or a `version` column.
- Make no network calls inside an open transaction.
- Lock rows and tables in one fixed order; retry deadlock errors with bounded backoff.
- Bind every value as a query parameter; never concatenate input into SQL.
- Declare `NOT NULL`, `FOREIGN KEY`, `UNIQUE` and `CHECK` constraints in the schema.
- Order composite indexes equality first, then sort or range; drop unused indexes.
- Page with `ORDER BY <unique key> LIMIT n` and keyset `WHERE id > :last`, not large `OFFSET`.
- Migrate with expand and contract; build indexes online (`CONCURRENTLY` or the engine's online DDL).
- Test restores from backup on a schedule, including point-in-time recovery.

## Common mistakes

- Selecting `*` or querying inside application loops (N+1).
- Adding a `NOT NULL` column without default to a large table.
- Random UUIDv4 primary keys on large clustered tables.
- Oversized connection pools; size them to the database CPU and I/O.
