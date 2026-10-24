# .NET Microservices Architecture & Engineering Handbook

## 1. Domain-Driven Design (DDD) Layering

In enterprise .NET microservices solutions, each bounded service is organized into four canonical layers:

```text
[Presentation / API] ---> [Application / Use Cases] ---> [Domain (Core)]
          |                         |                          ^
          v                         v                          |
[Infrastructure (DB, Message Bus, External Clients)] -----------+
```

### 1.1. Domain Layer (Core - Invariant Center)
- Zero external dependencies: no ASP.NET Core, Entity Framework, Kafka, or third-party infrastructure packages.
- Contains: Entities, Value Objects, Domain Events, Domain Exceptions, and Repository Interfaces (`IRepository<T>`).
- All business logic and domain invariants must reside strictly inside this layer.

### 1.2. Application Layer (Use Case Orchestration)
- Contains: CQRS Handlers (Commands, Queries, MediatR / Wolverine Handlers), DTOs, Mappings, and Validation Pipeline Behaviors.
- Depends exclusively on the Domain Layer. Interacts with persistence and external services through abstractions (`IOrderRepository`, `IEventBus`).

### 1.3. Infrastructure Layer (Technology & Integrations)
- Implements Domain and Application abstractions: EF Core `DbContext`, Kafka Event Producers/Consumers, Redis Cache, HTTP clients.
- Houses concrete database providers and drivers (Npgsql, Microsoft.EntityFrameworkCore.SqlServer, Confluent.Kafka).

### 1.4. Presentation / API Layer
- Entry point for HTTP requests or gRPC endpoints (Controllers, Minimal APIs).
- Configures Dependency Injection (DI container), middleware pipeline, authentication, and authorization.

---

## 2. Kafka Event Bus & Outbox Pattern

### 2.1. Transactional Outbox Pattern
To guarantee eventual consistency and eliminate dual-write hazards (DB write succeeds but Kafka publish fails):
1. Inside the command transaction, write both domain state changes and event records into an `OutboxMessages` table atomically.
2. A background worker (or Debezium CDC) periodically scans `OutboxMessages`, publishes messages to Kafka topics, and flags them as processed upon broker acknowledgment.

### 2.2. Kafka Consumer Idempotency
- Consumers must be resilient to duplicate delivery (at-least-once semantics).
- Use an `InboxMessages` table or verify `MessageId` / `EventId` presence before triggering domain effects:
  ```csharp
  if (await _inboxRepository.HasProcessedAsync(eventMessage.Id, cancellationToken))
  {
      _logger.LogInformation("Event {EventId} already processed. Skipping.", eventMessage.Id);
      return;
  }
  ```

---

## 3. Unit Testing with NSubstitute

NSubstitute is the canonical, concise mocking framework in the .NET ecosystem.

### 3.1. Setup and Return Values
```csharp
var repository = Substitute.For<IOrderRepository>();
var eventBus = Substitute.For<IEventBus>();

// Mock asynchronous Task<T> return
repository.GetByIdAsync(orderId, Arg.Any<CancellationToken>())
    .Returns(Task.FromResult<Order?>(expectedOrder));
```

### 3.2. Call Invariant Verification
```csharp
// Verify SaveChangesAsync was invoked exactly once
await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());

// Verify event published with specific payload assertions
await eventBus.Received(1).PublishAsync(
    Arg.Is<OrderCreatedEto>(e => e.OrderId == orderId && e.TotalAmount > 0),
    Arg.Any<CancellationToken>()
);

// Verify no persistence occurred when validation failed
await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
```

---

## 4. ProjectReference & Module Boundaries
- **Prevent Circular References**: Never introduce cross-project references between independent microservices.
- **Shared Contracts**: Publish lightweight contract packages/classlibs (e.g., `OrderService.Contracts`) containing only DTOs and event topics. Never leak Domain Entities or DbContexts across service boundaries.
- **Segregate Test Suites**: Clearly split `*.UnitTests.csproj` (in-memory mocks, fast execution) from `*.IntegrationTests.csproj` (Testcontainers, real database/broker instances).

---

## 5. Optimized .harnixignore Configuration
To keep repo-map indexing, git diffs, and token footprint lean and accurate, always exclude build artifacts in `.harnixignore`:
```ignore
# .NET Build & Cache Artifacts
bin/
obj/
TestResults/
.vs/
*.user
*.suo
packages/
```
