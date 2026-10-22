# Spring guide

## Verify

```text
./mvnw verify
./gradlew check
```

## Constraints

- Use constructor injection; never field `@Autowired`.
- Bind config with `@ConfigurationProperties` plus `@Validated`; keep secrets in the environment, not `application.properties`.
- Set `spring.jpa.open-in-view=false`; keep `@Transactional` on service methods, not controllers or repositories.
- Return DTOs from controllers, never JPA entities; validate with `@Valid` and Bean Validation; never use `@Data` on entities.
- Extend auditable `BaseEntity` (`@CreatedDate`, `@LastModifiedDate`); use `@Version` for optimistic locking and `@SQLRestriction` for soft delete.
- Handle errors centrally with `@RestControllerAdvice` and `ProblemDetail`, returning standardized `[DOMAIN]_[ACTION]_[REASON]` error codes.
- Prevent N+1 with `@EntityGraph`, `JOIN FETCH` or `@BatchSize`; use `Pageable` for list endpoints.
- Use Flyway or Liquibase for schema changes and `spring.jpa.hibernate.ddl-auto=validate` outside local; test rollbacks before deploy.
- Define one `SecurityFilterChain` bean; use BCrypt cost >= 12, rotate refresh tokens, and enable method security with `@PreAuthorize`.
- Test with `@WebMvcTest`/`@DataJpaTest` slices and Testcontainers for real databases; mask PII in logs with SLF4J templates.

## Common mistakes

- `@Transactional` on private methods or self-invoked calls (proxy bypassed).
- `LazyInitializationException` fixed by eager fetching everything.
- `@SpringBootTest` for every test, slowing the suite.
- Catching exceptions inside `@Transactional` so rollback never happens.
- Exposing all Actuator endpoints publicly or logging unmasked credentials/tokens.
