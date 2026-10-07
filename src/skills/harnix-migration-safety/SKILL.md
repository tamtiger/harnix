---
name: harnix-migration-safety
description: Use when designing or reviewing schema migrations, contract breaking changes, data transitions or structural refactorings to guarantee data preservation and backward compatibility.
metadata:
  version: "2.3.0"
---

# Migration safety and data preservation

Design and verify schema and contract changes to ensure historical data remains readable, migrations are idempotent, and rollbacks are safe.

## Evidence and Rationale

Evidence source: `research/external-research.md` (§C IFScale 2507.11538 regarding instruction growth and compliance decay, and Harnix Core Decision D1/D11 in `docs/OVERHAUL_DECISIONS.md` on breaking changes requiring legacy readability).
Schema updates and storage refactorings pose significant risks of data corruption or historical loss. Migration safety ensures that structural evolution preserves existing records and handles incomplete runs gracefully.

## When to use

- When modifying task schemas, manifest formats, configuration shapes, or persistent storage models.
- When deprecating, renaming, or removing public fields, commands, or data artifacts.
- When reviewing migration adapters or data upgrade scripts.

## Safety rules

1. **Read-compatibility of legacy data**:
   - Earlier schema versions must remain readable without loss of information.
   - Older records must not be forcefully rewritten or modified in place unless an explicit, authorized migration action is triggered.

2. **Idempotence**:
   - Running the migration multiple times on the same input must produce identical results without duplicating or corrupting data.
   - A partially failed migration must not leave files in an unrecoverable corrupted state.

3. **Atomic write and rollback safety**:
   - Persist changes using atomic replacement (write to temporary sibling file, sync, atomic rename).
   - Maintain provenance markers or migration audit evidence to trace when and how data was transformed.

4. **Schema validation boundary**:
   - Strictly validate input before writing migrated payloads.
   - Reject unvalidated fields, malformed UTF-8 text, or orphaned references.

## Verification checklist

- [ ] Golden fixtures: existing test suites load historical raw fixtures from earlier versions and verify correct parsing.
- [ ] Roundtrip test: verify that reading legacy data through the migration adapter produces valid current records.
- [ ] Interrupted migration: verify that a crash or abort before completion does not delete user data or leave unreadable state.
- [ ] No silent mutation: confirm that read-only commands do not mutate persistent disk state.
