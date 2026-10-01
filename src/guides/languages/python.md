# Python guide

## Verify

```text
ruff check .
ruff format --check .
mypy .
pytest
```

Use `pyright` instead of `mypy .` when the repository configures Pyright.

## Constraints

- Declare dependencies and tool config in `pyproject.toml`; use a virtual environment, never the system interpreter.
- Annotate public function signatures; avoid `Any` and bare `# type: ignore`.
- Catch specific exceptions; never use bare `except:` and re-raise with `raise ... from err`.
- Never use mutable default arguments; use `None` and create the value inside.
- Use context managers (`with`) for files, locks, sockets and DB connections.
- Use `pathlib.Path` and `encoding="utf-8"` on text I/O.
- Run subprocesses with `subprocess.run([...], check=True, timeout=...)`; never `shell=True` with interpolated input.
- Use `secrets` for tokens and `yaml.safe_load` for YAML; never `pickle.loads` untrusted data.
- Use `logging` with lazy `%s` args, not `print` or f-strings in log calls.
- Make tests deterministic with `tmp_path`, `monkeypatch` and injected clocks.

## Common mistakes

- Blocking calls inside `async def` handlers.
- Naive `datetime.now()` where a timezone-aware value is required.
- Catching `Exception` and returning a default silently.
- Importing a module only for its side effects.
