# Python engineering guide

## Application architecture, packaging, and type hints

- Target modern Python versions (3.11+). Manage project dependencies, virtual environments, and build metadata using modern standards-compliant tools (such as `uv`, `poetry`, or `hatch`) configured via `pyproject.toml`.
- Keep modules clean and side-effect-free: importing a Python module must define classes, functions, and constants; it must never execute I/O, connect to external network services, or mutate global environment variables upon import.
- Leverage modern type hints comprehensively across all public function signatures, dataclasses, and domain models. Use standard collection generics (`list[str]`, `dict[str, int]`, `tuple[int, ...]`) and union syntax (`X | Y`, `X | None`) rather than legacy `typing` constructs.
- Run static type checking with `mypy` or `pyright` in strict mode. Treat type-checker warnings as structural design feedback; do not bypass type checks with `# type: ignore` or `Any` without documented architectural justification.
- Organize projects using the standard `src/` layout (e.g., `src/<package_name>/`) to prevent accidental imports of uninstalled local packages and ensure proper packaging isolation during test execution.

## Data modeling, immutability, and state management

- Model domain entities and data structures using Python dataclasses with `slots=True` and `frozen=True` (`@dataclass(frozen=True, slots=True)`), or Pydantic V2 models for automatic boundary validation and serialization.
- Prefer immutability and functional transformations over in-place state mutation. Never use mutable objects (such as empty lists `[]` or dicts `{}`) as default function argument values; use `None` as the sentinel default and instantiate within the function body.
- Encapsulate private state using single underscore prefixes (`_internal_method`) for non-public API surfaces. Avoid double underscore name mangling unless explicitly avoiding attribute collisions in complex class hierarchies.
- Manage shared dependencies via explicit constructor dependency injection. Avoid global mutable registries, thread-local ambient state, or hidden module globals that make unit tests fragile and order-dependent.
- Use `pathlib.Path` exclusively for filesystem operations instead of legacy `os.path` string manipulations. Always specify explicit UTF-8 encoding when opening files (`open(path, "r", encoding="utf-8")`).

## Concurrency, resource lifecycles, and error handling

- Manage external resources (files, database connections, locks, and network sessions) using context managers (`with` and `async with`). Ensure resources are guaranteed to release cleanly, even when unexpected exceptions occur.
- Choose concurrency models intentionally: use `asyncio` for non-blocking network I/O-bound tasks, `threading` for blocking I/O legacy adapters, and `multiprocessing` or `concurrent.futures.ProcessPoolExecutor` for CPU-intensive parallel processing to circumvent the Global Interpreter Lock (GIL).
- Avoid blocking the `asyncio` event loop: never execute synchronous blocking operations (e.g., `time.sleep()`, synchronous `requests`, or heavy disk reads) inside an async coroutine without offloading to `asyncio.to_thread()`.
- Raise precise, domain-specific custom exceptions inheriting from standard exceptions (`class DomainError(Exception): pass`). Catch narrow, specific exceptions where the program can safely recover or translate the failure; never write bare `except:` or `except Exception:` clauses that swallow unexpected errors silently.
- Support structured exception chaining using `raise NewException(...) from err` to preserve root-cause stack traces during failure translation.

## Security, testing, and observability

- Defend against injection attacks: execute subprocess commands using argument lists (`subprocess.run(["cmd", arg1, arg2], check=True)`) with `shell=False`. Never use `eval()`, `exec()`, or Python's unsafe `pickle` deserialization on untrusted user data; use secure JSON or Protocol Buffers instead.
- Use parameterized queries with database drivers and ORMs (SQLAlchemy, SQLModel). Never interpolate raw user strings into SQL queries.
- Write fast, deterministic automated tests using `pytest`. Structure tests with reusable fixtures (`@pytest.fixture`), enforce test isolation, and avoid touching production networks or live cloud resources by using in-memory databases or `httpx.AsyncClient` transports.
- Enforce code style, formatting, and linting with modern high-performance tools such as `ruff` (combining flake8, isort, and black rulesets). Keep lint checks strict in CI/CD pipelines.
- Implement structured JSON logging using libraries like `structlog` or the standard `logging` module configured with a JSON formatter. Include trace IDs and context parameters, and redact passwords, tokens, and personally identifiable information (PII) before emitting log records.
