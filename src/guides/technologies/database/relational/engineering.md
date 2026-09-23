# Relational database engineering guide

## Transactions and isolation

- Make every multi-statement change atomic: wrap it in a transaction with an explicit boundary, and know which isolation level the database uses by default and what anomalies it still allows under that level.
- Treat a read-then-write sequence as a race unless the database enforces it atomically through a conditional `UPDATE`, a unique constraint, a row lock taken for update, or an optimistic version column. Do not rely on application-level locking that a concurrent connection cannot see.
- Keep transactions short and know what they hold. A long-running transaction blocks cleanup work, holds locks other sessions are waiting on, and turns one slow client into a database-wide stall.

## Schema and index as a contract

- Treat an index as part of the query contract, not an afterthought. A lookup, join, or sort that runs in production without a matching index degrades linearly with table size until it does not, all at once.
- Encode invariants in the schema wherever the engine allows it — a unique constraint, a foreign key, a check constraint, a not-null column — instead of trusting every application write path to enforce them consistently.
- Version every schema change as a migration, run it against production-shaped data before trusting its plan, and keep each migration backward compatible with the previous release until that release is fully retired.

## Query discipline

- Give every list query a stable order and an explicit bound. An unordered limited query returns an arbitrary subset, and an unbounded query is a future incident waiting for the table to grow.
- Parameterize every value that crosses from user input into a query. Never build a query by concatenating a value into its text, even a value that looks safely typed.
- Watch for repeated per-row access: a loop that issues one query per item instead of one query for the whole batch. Fetch or join exactly what the use case needs, once.

## Connections and migration safety

- Pool connections deliberately and size the pool against the database's real connection budget, not the number of concurrent requests you would like to serve. An exhausted pool fails every caller at once.
- Make a migration safe to run against live traffic: add a column as nullable or with a default before backfilling it, and drop a column only once every reader has stopped depending on it.
- Prefer the database's own backup and point-in-time recovery mechanism over a hand-rolled export, and rehearse a restore before you need one for real.
