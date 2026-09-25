# Django engineering guide

## Application architecture and project structure

- Organize Django projects into focused, cohesive applications (`apps/`) with single responsibilities (e.g., `accounts`, `billing`, `catalog`). Avoid creating monolithic "core" apps that accumulate unrelated business logic.
- Follow the "fat models, thin views" or service-layer architecture. Keep view controllers focused on HTTP parameter extraction, permission enforcement, and template/serializer dispatch. Place complex domain algorithms, transactions, and business calculations in dedicated service modules (`services.py`) or model methods.
- Define explicit URL namespacing (`app_name = "billing"`) and keep routing configurations modular with `include()` in the root `urls.py`. Always use `reverse()` or `reverse_lazy()` instead of hardcoding absolute URL strings.
- Manage settings using environment variables (via `django-environ` or `python-dotenv`). Separate base settings (`base.py`) from environment-specific configurations (`production.py`, `local.py`, `testing.py`). Never commit secret keys, database credentials, or API tokens into version control.
- When building RESTful APIs with Django REST Framework (DRF), use `APIView`, `GenericAPIView`, or `ModelViewSet` consistently. Structure serializers into distinct read/write representations to avoid unintended field mutation.

## Models, migrations, and database optimization

- Design database models with explicit constraints, field types, and default values. Always specify `db_index=True` on frequently queried or filtered fields and use `Meta.indexes` for composite indexes.
- Manage migrations with discipline. Never edit or delete applied migrations in shared environments without coordinated team procedures. Use `--check` and `--dry-run` in CI/CD pipelines to catch ungenerated migrations before deployment.
- Prevent the N+1 query problem by aggressively using `select_related()` for single-valued relationships (ForeignKey, OneToOne) and `prefetch_related()` for multi-valued relationships (ManyToMany, reverse ForeignKey).
- Enforce transactional integrity using `transaction.atomic()` around multi-step database writes. Use `select_for_update()` to prevent race conditions during concurrent balance deductions or inventory updates.
- Keep background and long-running operations (such as sending emails, generating reports, or webhook dispatching) out of the HTTP request-response cycle by delegating them to Celery or Django Q task queues.

## Security, authentication, and error handling

- Implement custom user models (`AbstractUser` or `AbstractBaseUser`) at project inception before running the initial migration. Swapping user models after database initialization is notoriously difficult.
- Leverage Django's built-in security middlewares: enforce CSRF protection (`CsrfViewMiddleware`), clickjacking protection (`XFrameOptionsMiddleware`), and SSL redirection (`SecurityMiddleware`).
- Secure session cookies by configuring `SESSION_COOKIE_SECURE = True`, `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = "Lax"`, and enabling HSTS headers in production environments.
- Protect against SQL injection by using the Django ORM's parameterized query builder. Never format or concatenate untrusted user input directly into `extra()` or `raw()` SQL clauses without parameterized tuples.
- Sanitize HTML inputs using libraries like `bleach` when accepting rich user text. Use Django's template engine auto-escaping by default; avoid the `|safe` filter unless content has been rigorously sanitized.

## Testing, performance, and monitoring

- Write comprehensive tests using `pytest-django` or Django's built-in `TestCase`. Prefer `TestCase` over `SimpleTestCase` or `TransactionTestCase` for database tests because it wraps each test in a rolled-back transaction, ensuring fast and isolated test runs.
- Use `factory_boy` and `faker` instead of hardcoded fixtures to generate realistic, maintainable test data with minimal test coupling.
- Test both model validation (`full_clean()`), permissions, serializer validation rules, and HTTP response status codes. Verify that permission denials return HTTP 403 or 401 as appropriate.
- Monitor database performance with tools like `django-debug-toolbar` during local development to inspect query counts, execution times, and cache hits.
- Expose readiness and liveness health checks (verifying database and cache connectivity) for container orchestrators, and configure structured logging to capture unhandled exceptions with full contextual metadata.
