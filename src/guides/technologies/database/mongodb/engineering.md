# MongoDB engineering guide

## Schema design and document shape

- Design the document shape around how the application reads data, not around a normalized relational mental model. Embed data that is always read together, and reference data that is large, shared across many parents, or updated independently.
- Avoid unbounded array growth inside a single document. A document has a hard size ceiling, and an ever-growing embedded array degrades write performance long before it reaches that ceiling.
- Encode invariants with collection-level schema validation where the driver supports it, rather than trusting every write path to enforce document shape by convention alone.

## Consistency and transactions

- A single-document write is atomic by default. Reach for a multi-document transaction only when an operation genuinely spans multiple documents or collections and cannot be restructured to avoid it, because a transaction adds real overhead and lock contention.
- Read and write concern levels trade durability against latency. Know which concern level a given operation actually uses, especially for a read that must see its own immediately preceding write.
- A duplicate-key error on a unique index is the correct way to prevent a race in a find-or-create pattern; do not replace it with an application-level check-then-insert.

## Indexing and query patterns

- Every query pattern the application actually runs needs a supporting index. A collection scan on a large collection is a production incident waiting for enough data to accumulate.
- Order compound index fields by equality predicates first, then range predicates, then sort fields, matching how the query actually filters and sorts.
- Use the aggregation pipeline for a computation the database can perform close to the data, instead of pulling a large result set into application code to transform it.

## Operations

- Understand the replica set's read preference and write concern defaults before assuming a read sees the latest write, especially when reading from a secondary member.
- Size and monitor the working set against available memory. A working set that no longer fits in memory turns routine queries into disk-bound operations.
- Test a migration or schema-validation change against representative production-shaped documents, since a schema-less store still has a de facto schema the application depends on.
