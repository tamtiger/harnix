# Calling an API for real

Prove the contract by sending real requests to a locally started instance, in an isolated environment (see `safety`).

## Tool order

1. **The project's own HTTP test support** (the framework's in-process test client or test host). Always preferred: same language, same runner, already trusted.
2. **A plain-text request runner such as Hurl** when the project has no HTTP test support or has no OpenAPI file. A `.hurl` file holds the request, `[Captures]` to carry values (an id) into the next request, and `[Asserts]` on status, headers, JSON paths and duration. `hurl --test --report-junit <file>` gives a JUnit report; its exit code is non-zero on a failed assertion (confirm the exact codes with `hurl --help` for the installed version).
3. **A schema-driven tool such as Schemathesis** only when an OpenAPI file exists and the user agrees. It sends many generated requests and `creates, changes and deletes real data`, so point it only at an isolated instance with throwaway data, never a shared or production one.
4. **A short script** with the runtime already on the machine, when none of the above is present.

Each tool is optional: detect it first (`harnix skill harnix-exercise --reference detection`), name it to the user, and never install it unasked.

## Scenarios from the contract

- Happy path: the documented success status and the fields the contract requires, with the right types.
- Boundary: empty, maximum length, the first value outside the allowed range, a missing optional field.
- Error: invalid input (a 4xx with the documented error shape), missing or invalid credentials, unknown id.
- Idempotency and ordering when the contract states them: repeat a PUT or DELETE, create then read then delete.
- Take expected values from the criteria and contract only; if they are silent, ask instead of guessing.

## Sandbox and mock modes

Many services have a sandbox, in-memory or mock mode so tests need no real database or third party. Detect it (an environment flag, a test profile) and force it in test setup, with empty or throwaway connection strings.

- Write a small request helper that calls the route handler or the test host and returns status and parsed body.
- Assert the response shape against the contract: required fields exist with the expected type, not only the status code.
- When a route has both a sandbox path and a real path, assert that both return the same shape; a fix made in only one is a common regression.
- Add one regression test per bug found, named after the bug (`BUG-123 returns 404 for unknown id`), asserting the corrected behavior.

## Starting and stopping the target

Start it on a declared port with a readiness probe (poll a health route with a timeout), run the scenarios, and always stop it, even on failure. Do not assume port 3000 is free.

## Evidence

Keep the request file or script, the report (JUnit or output) and the exit code. Redact tokens and personal data from saved bodies. Record the run with `harnix workflow --run-check` as described in `evidence`.
