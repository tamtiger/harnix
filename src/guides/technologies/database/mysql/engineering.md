# MySQL engineering guide

## Storage engine and transaction behavior

- Confirm the transactional storage engine is used for any table that needs transactions, foreign keys, or row-level locking. A legacy non-transactional engine silently drops all three.
- The default isolation level allows phenomena that surprise developers coming from other engines. Know the actual isolation level and gap-locking behavior before assuming a read inside a transaction reflects the latest committed state.
- A large or wide transaction holds row and gap locks that block unrelated writers. Keep write transactions narrow and commit them promptly.

## Schema and index specifics

- Choose a primary key that is short, sequential, and stable. The engine clusters the table on the primary key and every secondary index carries a copy of it, so a wide or changing primary key inflates every secondary index.
- Choose character set and collation deliberately per column and keep them consistent across joined columns; a mismatched collation silently disables the index on a comparison.
- A migration that rewrites a large table can lock it for the duration under the default algorithm. Use an online schema-change approach for a table that still has live traffic during the change.

## Replication and operational specifics

- Know whether replication is statement-based, row-based, or mixed, because it changes which non-deterministic statements are safe to run without producing divergence between primary and replica.
- Read replicas lag. A read that must see its own preceding write should route to the primary, or to a replica with a bounded and monitored lag guarantee, not to an arbitrary replica.
- Back up with a tool that produces a consistent snapshot rather than a naive copy of a live data directory, and rehearse a point-in-time restore before depending on it in an incident.
- A schema-change tool that rebuilds an entire table can spike disk usage and I/O; size the change window and verify available disk space before running it against a table larger than what fits comfortably in memory.
