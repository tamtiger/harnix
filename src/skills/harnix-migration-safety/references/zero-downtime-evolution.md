# Zero-Downtime Migration & Evolution Handbook

## 1. Principles of Zero-Downtime Evolution
When evolving schemas or message contracts in distributed systems:
1. **Never Assume System Downtime**: Older instances (V1) and newer instances (V2) will always execute concurrently during rolling deployments.
2. **Bidirectional Compatibility**: Data produced by V1 must be readable by V2, and data written by V2 must remain parseable by V1 without crashes or data corruption.

## 2. The Four-Phase Expand & Contract Pattern
```text
1. Expand -> 2. Dual-Write -> 3. Backfill -> 4. Contract
```

### Phase 1: Expand (Non-Breaking Schema Growth)
- Add new fields or columns as nullable or with deterministic default values.
- Never drop, rename, or attach non-default `NOT NULL` constraints in this phase.
- Deploy the updated application capable of reading both legacy and new structures (with graceful fallback).

### Phase 2: Dual-Write (Parallel Mutation)
- The application begins writing state changes to both legacy and new columns/structures atomically within the same transaction.
- Legacy downstream consumers and external systems continue reading the legacy representation seamlessly.

### Phase 3: Backfill (Historical Data Synchronization)
- Run batched background workers or migration scripts to populate historical records missing the new representation.
- Apply throttling, checkpointing, and bounded chunking to avoid database lock contention and I/O saturation.

### Phase 4: Contract (Phased Retirement & Cleanup)
- Once historical data is 100% backfilled and no service references the legacy representation:
- Switch services to read and write exclusively to the new representation.
- Decommission dual-write logic. Drop legacy columns/fields in a subsequent, independent release.

## 3. Event & Message Contract Evolution
- **Tolerant Reader**: Consumers ignore unmapped or unfamiliar fields without throwing parsing exceptions.
- **Producer Safety**: Producers never remove or alter the semantics of fields expected by existing consumers.
- **Breaking Contract Versioning**: When incompatible semantic changes are unavoidable, publish a distinct event type or route to a V2 topic, operating dual streams throughout the transition period.
