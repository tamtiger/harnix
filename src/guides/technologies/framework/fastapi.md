# FastAPI guide

## Verify

```text
pytest
ruff check .
ruff format --check .
mypy .
```

## Constraints

- Declare `response_model` and Pydantic request models on every route; never return ORM objects or secrets directly.
- Use `Depends` for DB sessions, auth and settings; override with `app.dependency_overrides` in tests.
- Use `async def` only with async I/O; run blocking calls in `def` routes or `run_in_threadpool`.
- Load config with pydantic-settings `BaseSettings` from the environment; never hardcode secrets.
- Raise `HTTPException` with the correct status code and register exception handlers for domain errors.
- Configure `CORSMiddleware` with explicit origins; never `allow_origins=["*"]` with credentials.
- Manage schema changes with Alembic migrations; run them outside request handling.
- Use `lifespan` for startup and shutdown resources, not deprecated `on_event`.
- Test with `TestClient` or `httpx.AsyncClient` plus `ASGITransport`.

## Common mistakes

- Blocking calls (`requests`, sync ORM, `time.sleep`) inside `async def`.
- Sharing one DB session across requests instead of a per-request dependency.
- Missing `response_model_exclude` leaking password hashes.
- Mutable default values in Pydantic models or dependencies.
- Spawning `asyncio.create_task` without keeping a reference.
