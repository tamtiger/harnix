# MongoDB engineering guide

## Document modeling, schema validation, and storage engine

- Standardize on modern MongoDB versions (MongoDB 6.0 or MongoDB 7.0+). Structure domain documents following the core rule of document databases: "Data that is accessed together should be stored together."
- Choose intentionally between Embedding and Referencing:
  - **Embedding**: Embed child subdocuments or arrays for 1-to-1 or bounded 1-to-few relationships (e.g., shipping addresses on a user, items in a finalized order) where child items are always retrieved, updated, and deleted in conjunction with the parent.
  - **Referencing**: Use normalized references (`ObjectId` or foreign identifiers) for unbounded 1-to-many relationships (e.g., user comments, activity logs) or many-to-many relationships to avoid violating the strict 16MB BSON document size limit and prevent memory exhaustion during document re-allocation.
- Enforce schema validation directly at the collection level using `$jsonSchema`. Specify required fields, BSON types (`bsonType: "string"`, `"int"`, `"date"`), and acceptable value bounds. Never rely entirely on application-layer schemas (like Mongoose) to protect database integrity against errant external writes or scripts.
- Understand the WiredTiger storage engine: WiredTiger uses an internal cache typically sized to 50% of (RAM - 1GB). Ensure database working sets (frequently accessed documents and active indexes) fit comfortably within WiredTiger cache memory to avoid slow, I/O-heavy page evictions from disk.
- Avoid the Anti-pattern of massive unbound arrays: arrays that grow indefinitely (`$push` on unbounded logs or sensor metrics) trigger frequent document relocations on disk and degrade read/write performance exponentially.

## Indexing strategies, compound keys, and query optimization

- Design indexes to support specific application queries: follow the ESR Rule (Equality, Sort, Range) when creating compound indexes:
  Place equality filtering fields first, followed by sorting fields, and range filtering fields last: `createIndex({ tenantId: 1, status: 1, createdAt: -1, price: 1 })`.
- Understand Multikey Indexes on array fields: MongoDB automatically creates a multikey index when indexing an array attribute. Avoid compound indexes containing more than one array field, as MongoDB strictly prohibits compound multikey indexes where multiple fields are arrays (preventing explosive cartesian index combinations).
- Leverage Partial Indexes and Sparse Indexes: use partial indexes with a `partialFilterExpression` (e.g., indexing only `{ status: "pending" }` or `{ deletedAt: null }`) to reduce index memory footprint and accelerate lookups over sparse subsets of documents.
- Automate document expiration using TTL Indexes (Time-To-Live): create a TTL index on a BSON Date field (`createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })`) to allow MongoDB's background thread to automatically purge expired user sessions, temporary tokens, and ephemeral cache entries without application intervention.
- Analyze query performance using `explain("executionStats")`: ensure queries evaluate via `IXSCAN` (Index Scan) rather than `COLLSCAN` (Full Collection Scan). Verify that the ratio of `totalKeysExamined` to `nReturned` is close to 1:1, and watch out for in-memory sorting warnings (`SORT_KEY_GENERATOR` with no index sort).

## Aggregation Pipeline optimization and atomic operations

- Optimize Aggregation Pipelines: filter and trim documents as early as possible in the pipeline. Place `$match` and `$project` stages at the very beginning of the pipeline so subsequent processing stages operate on a minimal set of document fields.
- Leverage index support in aggregations: ensure the initial `$match` and `$sort` stages take advantage of compound indexes. Never place `$unwind`, `$group`, or `$lookup` before an indexable `$match` stage.
- Optimize `$lookup` joins: treat `$lookup` as an expensive distributed join operation. Always ensure the `foreignField` in the target collection is covered by an index, and consider caching or denormalizing frequently joined summary data to reduce runtime join overhead.
- Utilize Atomic Single-Document Updates: take advantage of atomic operators (`$set`, `$inc`, `$push`, `$pull`, `$addToSet`) to modify document properties in place without reading the document first.
- Implement conditional updates with optimistic concurrency: update documents atomically using a version or revision field:
  `collection.updateOne({ _id: id, version: currentVersion }, { $set: { balance: newBalance }, $inc: { version: 1 } })`
  Check that `matchedCount === 1` to guarantee the update succeeded without concurrent modification conflicts.

## Transactions, Replica Sets, and Write/Read Concerns

- Deploy MongoDB strictly as a Replica Set (minimum 3 nodes: 1 Primary, 2 Secondaries) even in single-node testing setups. Replica sets are mandatory for change streams, high-availability automatic failover, and multi-document ACID transactions.
- Use Multi-Document Distributed Transactions (`session.startTransaction()`) judiciously: wrap multi-collection mutations in transactions only when strict multi-document consistency is non-negotiable. Keep transactions short (default 60-second limit) to prevent WiredTiger write-conflict errors and snapshot cache pressure.
- Configure Write Concerns deliberately:
  Use `w: "majority"` with `j: true` (journaled) for critical financial transactions and permanent user records to guarantee data is committed to disk on a majority of replica nodes before returning success. Use `w: 1` only for non-critical, high-throughput ingestion (telemetry, clickstream).
- Configure Read Concerns and Read Preferences:
  Use Read Concern `"majority"` or `"linearizable"` for mission-critical reads where reading stale or uncommitted rollback data is unacceptable. Route read-heavy analytics queries to secondary nodes using `readPreference: "secondaryPreferred"` while keeping transactional reads on the primary node.
- Monitor cluster health and connection pools: configure connection pool limits (`maxPoolSize`) aligned with available database worker threads, and automate point-in-time recovery (Oplog continuous backup) using MongoDB Atlas or Ops Manager.
