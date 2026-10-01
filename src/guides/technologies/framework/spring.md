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
- Return DTOs from controllers, never JPA entities; validate with `@Valid` and Bean Validation.
- Handle errors centrally with `@RestControllerAdvice` and `ProblemDetail`.
- Prevent N+1 with `@EntityGraph` or `JOIN FETCH`; use `Pageable` for list endpoints.
- Use Flyway or Liquibase for schema changes and `spring.jpa.hibernate.ddl-auto=validate` outside local.
- Define one `SecurityFilterChain` bean; never extend the removed `WebSecurityConfigurerAdapter`; enable method security with `@PreAuthorize`.
- Test with `@WebMvcTest`/`@DataJpaTest` slices and Testcontainers for real databases; expose only needed Actuator endpoints.

## Common mistakes

- `@Transactional` on private methods or self-invoked calls (proxy bypassed).
- `LazyInitializationException` fixed by eager fetching everything.
- `@SpringBootTest` for every test, slowing the suite.
- Catching exceptions inside `@Transactional` so rollback never happens.
- Exposing all Actuator endpoints publicly.
