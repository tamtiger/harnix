# Java engineering guide

## Modern language features, records, and type hierarchy

- Target modern LTS Java versions (Java 17 or Java 21+). Take full advantage of modern language enhancements: `record` classes for transparent immutable data carriers, text blocks (`"""..."""`) for readable multi-line templates, and pattern matching for `instanceof` and `switch` expressions.
- Model restricted domain hierarchies using `sealed` classes and interfaces (`public sealed interface PaymentMethod permits CreditCard, BankTransfer, Crypto`). Combine sealed types with pattern-matching switch statements to guarantee compile-time exhaustiveness checks without requiring redundant `default` branches.
- Avoid legacy Java anti-patterns: eliminate raw collection types, deprecate usage of `Vector`, `Hashtable`, and raw synchronized wrappers. Always specify explicit type arguments on collections (`List<String> list = new ArrayList<>();`).
- Enforce immutability and thread safety: declare fields `final` wherever possible, return unmodifiable views or defensive copies of collections (`List.copyOf()`, `Map.copyOf()`), and avoid exposing internal mutable state from domain objects.
- Eliminate primitive obsession: wrap fundamental domain identifiers (e.g., `CustomerId`, `AccountId`) into value records or dedicated domain classes rather than passing ambiguous raw `Long` or `UUID` values across business methods.

## Concurrency, Virtual Threads, and resource management

- Leverage Java 21+ Virtual Threads (`Thread.ofVirtual().start(...)` or `Executors.newVirtualThreadPerTaskExecutor()`) for high-throughput, blocking I/O-bound server applications. Virtual threads eliminate the complexity of reactive programming models while achieving massive concurrent connection density.
- Avoid pinning virtual threads: do not execute long-running blocking operations inside `synchronized` blocks or methods; use `java.util.concurrent.locks.ReentrantLock` instead to allow virtual threads to yield execution gracefully.
- Master structured concurrency: coordinate concurrent subtasks using `StructuredTaskScope` (Preview in Java 21+) to enforce parent-child lifetime boundaries and eliminate orphaned background tasks upon failures.
- Manage external and system resources reliably using try-with-resources statements (`try (var stream = ...)`). Implement `AutoCloseable` on all classes managing open sockets, database connections, or file handles.
- Never write bare `new Thread()` in application code; use managed, bounded `ExecutorService` pools with explicit rejection policies (`ThreadPoolExecutor.CallerRunsPolicy` or `AbortPolicy`) to prevent out-of-memory thread exhaustion.

## Security, validation, and defensive programming

- Prevent SQL Injection: always use parameterized queries via JPA/Hibernate, Spring Data, or raw `PreparedStatement` with typed parameter binding (`stmt.setString(1, name)`). Never concatenate untrusted strings into SQL or HQL statements.
- Defend against XML External Entity (XXE) and deserialization exploits: disable external DTDs and entities when parsing XML with `DocumentBuilderFactory` or `SAXParserFactory`. Never use raw Java native object deserialization (`ObjectInputStream.readObject()`) on untrusted data; use secure JSON or Protocol Buffers parsers instead.
- Sanitize logging to prevent log injection (CWE-117): strip newline characters (`\r`, `\n`) from untrusted inputs before logging, and redact sensitive tokens, passwords, and API keys.
- Validate inputs at the system boundary using Jakarta Bean Validation (Hibernate Validator) annotations (`@NotNull`, `@Size`, `@Pattern`, `@Valid`). Reject malformed input early before invoking business logic.
- Design clear domain exceptions: create checked exceptions only for recoverable business scenarios that callers must handle, and use unchecked runtime exceptions (`RuntimeException`) for unrecoverable errors or boundary validation failures.

## Testing, performance, and tooling

- Write comprehensive automated tests using JUnit 5 (Jupiter), AssertJ for fluent assertions, and Mockito for boundary mock isolation. Leverage `@ParameterizedTest` with `@ValueSource` or `@CsvSource` to cover diverse boundary inputs with minimal boilerplate.
- Test both sunny and rainy paths: test invalid argument rejections (`assertThatThrownBy(...)`), network timeouts, and concurrency race conditions.
- Use Testcontainers to spin up ephemeral, production-identical Docker containers (PostgreSQL, Kafka, Redis) for deterministic integration and repository testing.
- Profile JVM memory, garbage collection, and CPU allocation bottlenecks using Java Flight Recorder (JFR) and JDK Mission Control (JMC). Choose modern GC algorithms (G1GC or ZGC) aligned with application latency and throughput requirements.
- Maintain code hygiene and formatting using Maven or Gradle plugins: enforce Spotless for consistent formatting, Checkstyle for architectural conventions, and SpotBugs / SonarLint for automated vulnerability scanning in CI pipelines.
