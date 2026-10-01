# MongoDB guide

## Verify

```text
mongosh --eval "db.runCommand({ ping: 1 })"
mongosh --eval "db.<collection>.find(<filter>).explain('executionStats')"
mongosh --eval "db.<collection>.getIndexes()"
```

## Constraints

- Embed only bounded, co-read children; reference unbounded ones to stay under the 16MB document limit.
- Enforce `$jsonSchema` validators on the collection, not only in the ODM.
- Order compound indexes by ESR: equality, sort, range.
- Require `IXSCAN` in explain; `totalKeysExamined` should be close to `nReturned` and no in-memory sort.
- Never index two array fields in one compound index.
- Use `partialFilterExpression` for subset indexes and a TTL index (`expireAfterSeconds`) on a Date field for expiry.
- Put `$match` and `$project` first in pipelines; index the `$lookup` `foreignField`.
- Use atomic operators (`$set`, `$inc`, `$addToSet`) and guard updates with `{ _id, version }`, checking `matchedCount === 1`.
- Run a replica set; use `w: "majority"` for critical writes and keep transactions short.
- Set `maxPoolSize` explicitly.

## Common mistakes

- Unbounded `$push` arrays for logs or metrics.
- Running `find` without an index on the filter, causing `COLLSCAN`.
- Using multi-document transactions where one-document updates suffice.
- Reading stale data with default read concern for critical reads.
