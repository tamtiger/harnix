# Spring engineering guide

## Architecture, component scanning, and application design

- Standardize on modern Spring Boot 3+ (Spring Framework 6+). Structure applications into clear architectural layers: Web Controllers (`controller`), Business Service Layer (`service`), Data Access Repositories (`repository`), and Domain Entities / DTOs (`model`, `dto`).
- Keep Controllers transport-focused: parse HTTP request bodies and parameters, enforce validation, invoke domain services, and return typed `ResponseEntity<T>` instances. Never put business rules or raw database queries directly inside controller methods.
- Manage Dependency Injection cleanly: rely on constructor-based injection exclusively. Avoid field injection (`@Autowired` on private fields); constructor injection enforces required dependencies, immutability (`private final`), and makes unit testing effortless without needing reflection.
- Control component scanning boundaries: avoid placing broad, unstructured `@ComponentScan` annotations across the codebase. Keep the `@SpringBootApplication` entry point class at the root package level to scan child packages deterministically.
- Configure application properties hierarchically via `application.yml` or `application.properties`. Bind configuration sections to strongly-typed `@ConfigurationProperties` classes with `@Validated` to enforce validation upon application startup.

## Data access, transactions, and performance

- Use Spring Data JPA or Spring Data JDBC for relational data persistence. Define custom repository interfaces extending `JpaRepository` or `CrudRepository`.
- Prevent the N+1 query problem in Spring Data JPA: use `@EntityGraph`, JOIN FETCH in `@Query("SELECT ... JOIN FETCH ...")`, or DTO projections (`interface` or `record` projections) for read-heavy operations instead of blindly navigating lazy-loaded relationships.
- Manage transaction boundaries deliberately with `@Transactional(readOnly = true)` as the class-level default on service classes, overriding with `@Transactional` only on specific mutating methods. Keep transaction scopes small; never perform slow third-party HTTP calls or file uploads inside open database transactions.
- Handle database optimistic concurrency using `@Version` fields on entities to prevent silent data overwrites during concurrent updates.
- Offload long-running background tasks and asynchronous operations using `@Async` or Spring Integration / Spring Batch. Always configure an explicit custom `ThreadPoolTaskExecutor` bean rather than relying on Spring's default unbounded `SimpleAsyncTaskExecutor`.

## Security, validation, and error hygiene

- Configure application security using Spring Security 6 component-based configuration (`SecurityFilterChain` bean) rather than deprecated `WebSecurityConfigurerAdapter` inheritance.
- Protect web endpoints and resource APIs: configure stateless session management (`SessionCreationPolicy.STATELESS`) for REST APIs with OAuth2 Resource Server / JWT token validation (`oauth2ResourceServer(oauth2 -> oauth2.jwt(...))`).
- Enforce method-level security using `@PreAuthorize("hasRole('ADMIN')")` or `@PreAuthorize("hasAuthority('order:write')")` enabled via `@EnableMethodSecurity`.
- Validate incoming request DTOs at the controller boundary using Jakarta Validation annotations (`@Valid`, `@NotNull`, `@Size`, `@Email`). Ensure validation failures reject cleanly with HTTP 400 Bad Request before service invocation.
- Standardize error handling using `@RestControllerAdvice`. Implement exception handler methods returning RFC 7807 `ProblemDetail` instances. Ensure production error responses suppress internal stack traces, Hibernate SQL queries, and database driver connection details.

## Testing, observability, and production readiness

- Write fast, isolated slice tests using Spring Boot test slice annotations: `@WebMvcTest` for controller and security filter testing with `@MockBean` services; `@DataJpaTest` for repository testing; and pure JUnit 5 / Mockito unit tests for service business logic.
- Use `@SpringBootTest` sparingly for broad end-to-end integration flows. Pair integration tests with Testcontainers to execute against real, disposable Docker instances of PostgreSQL, MySQL, Kafka, or Redis rather than in-memory H2 databases with divergent SQL dialects.
- Expose production observability through Spring Boot Actuator (`/actuator/health`, `/actuator/metrics`, `/actuator/info`). Keep sensitive actuator endpoints (`/actuator/env`, `/actuator/beans`, `/actuator/heapdump`) strictly protected or disabled in production environments.
- Export metrics and distributed traces using Micrometer and OpenTelemetry. Propagate trace IDs (`traceId`, `spanId`) across logs via MDC (Mapped Diagnostic Context) using Logback or Log4j2 with structured JSON formatters.
- Implement graceful shutdown by configuring `server.shutdown: graceful` to allow in-flight HTTP requests and queue tasks to complete cleanly during container deployments.
