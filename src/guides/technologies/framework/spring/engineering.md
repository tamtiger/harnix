# Spring engineering guide

## Application structure

- Keep controllers/adapters responsible for transport, services for use-case coordination, and domain/persistence components for their own rules. Do not make a controller a transaction script or expose JPA entities as a public API contract.
- Use constructor injection and explicit configuration. Avoid field injection, service locators, and static access to application state because they obscure dependencies and complicate tests.
- Bind external configuration into typed, validated properties. Use profiles for intentional environment variation; do not branch business behavior on ad hoc environment reads.
- Understand auto-configuration before overriding it. Prefer a small explicit customization over duplicating a starter's configuration without knowing the resulting lifecycle.

## Validation, security, and errors

- Apply Bean Validation at request/application boundaries and keep cross-record business invariants in the domain/service layer. Validate both create and partial update semantics deliberately.
- Use Spring Security to authenticate and authorize, then enforce resource ownership where required. Method-level annotations complement rather than replace a clear authorization design.
- Map expected domain exceptions to stable API outcomes with a centralized exception-handling approach. Keep unexpected exceptions observable to operators without returning internals to callers.
- Do not bind client input directly to entities with sensitive fields. Use request DTOs and explicit mapping/allow-lists.

## Persistence and transactions

- Make transaction boundaries explicit around a use case. Know whether a method is read-only, how propagation behaves, and what exceptions trigger rollback.
- Avoid accidental lazy-loading/N+1 queries across serialization boundaries. Project read models or fetch intentionally, and test queries against representative data.
- Keep schema migrations versioned and review destructive changes. Use provider-realistic integration tests for locking, SQL semantics, indexes, and transaction behavior where in-memory substitutes would mislead.

## Operations and tests

- Expose health, metrics, and management endpoints with deliberate access control. Production diagnostics should help operators without disclosing secrets or internal topology.
- Use unit tests for decisions and focused Spring tests for serialization, MVC/security filters, repositories, transactions, and configuration. Use Testcontainers when a real dependent service is the only credible evidence, not as a default for every test.
