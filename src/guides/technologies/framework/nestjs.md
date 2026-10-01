# NestJS guide

## Verify

```text
nest build
eslint .
jest
jest --config test/jest-e2e.json
```

## Constraints

- Keep one module per feature; export only providers other modules need; avoid circular imports (`forwardRef` is a last resort).
- Controllers handle transport only; business logic lives in injectable services.
- Register a global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true` and `transform: true`.
- Define request bodies as DTO classes with `class-validator` decorators; never use interfaces or `any` for input.
- Apply auth with guards (`@UseGuards`), not inside handlers; use a global guard plus a `@Public()` opt-out.
- Map errors to `HttpException` subclasses or an exception filter; never return raw ORM errors.
- Read config through `ConfigModule`/`ConfigService` with a validated schema, not `process.env` in services.
- Test with `Test.createTestingModule` and override providers; cover controllers end to end with `supertest`.
- Call `app.enableShutdownHooks()` and implement `OnModuleDestroy` for connections.

## Common mistakes

- Missing `@Injectable()` or an unregistered provider, causing a dependency resolution error.
- Providing the same service in several modules, creating duplicate instances.
- Returning entities with sensitive fields instead of response DTOs (`ClassSerializerInterceptor`).
- Using request-scoped providers on hot paths.
- Forgetting `await` on repository calls inside transactions.
