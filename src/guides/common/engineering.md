# Harnix common engineering guide

## Start with the local contract

- Read repository instructions, the active task, architecture notes, package manifests, build scripts, and the closest tests before changing a behavior. Existing conventions are part of the contract.
- State the outcome, the affected boundary, and the acceptance evidence before editing. Do not solve adjacent problems merely because they are visible.
- Trace data and control flow from the public entry point to persistence or external I/O. Name assumptions that are not proven by code or tests.
- Preserve user-owned files, task data, generated artifacts with ownership metadata, and unrelated worktree changes. A clean-looking diff is never a reason to discard another change.

## Shape code around boundaries

- Keep transport, parsing, authorization, business decisions, persistence, and external clients distinct. Prefer small explicit adapters over hidden global state or implicit environment reads.
- Treat every value crossing a trust boundary as untrusted: HTTP input, queue messages, files, environment variables, command output, database rows, and LLM/tool input. Parse and validate it once at the boundary into a domain-shaped value.
- Make failure modes explicit. Return or throw errors with actionable operation context, but never include secrets, tokens, raw credentials, or machine-specific paths in user-facing errors or logs.
- Make ownership and mutation obvious. Avoid functions that both query and mutate unless that is the explicit domain operation. Keep side effects near the edge of the system.
- Design for cancellation, timeouts, retries, idempotency, and partial failure where network, filesystem, or background work is involved. Do not retry non-idempotent writes without a stable idempotency key or transaction boundary.

## Security and data handling

- Authenticate first, authorize every protected operation against the resource and tenant, and keep authorization policy near the application boundary. A UI check is not authorization.
- Use parameterized database APIs; never concatenate untrusted values into SQL, shell commands, paths, regular expressions, HTML, or interpreter input.
- Encode output for its destination context. Validation reduces bad input; it does not replace context-appropriate output encoding.
- Keep secrets out of source, fixtures, logs, exceptions, client bundles, and generated documentation. Use documented configuration mechanisms and fail clearly when required secrets are absent.
- Make destructive actions narrow, reviewable, and recoverable. Resolve targets before recursive operations; use transactions, atomic replacement, or durable staging where the storage system supports them.

## Manage background processes and shared resources

- Track every long-running process you start — command, port, and owning task or session — so it can be stopped deliberately instead of becoming an orphaned process nobody remembers to end. Prefer the harness's background-run facility, which makes exit observable, over a detached process you cannot see finish.
- Before starting a dev server, watcher, or build daemon, check whether one is already running for this project or port. On "address in use", identify and stop the stale owner instead of incrementing to a new port when the port is busy.
- Stop what you started when its task, session, or worktree ends. Only stop a process it started or clearly owns; a kill pattern broad enough to catch an unrelated process is never acceptable.
- Reconcile periodically: list the processes tied to this project and stop the ones that no longer map to an active task.

## Test the behavior that matters

- For a behavior change, first add a focused failing test that reproduces the observable defect or requirement. Then make the smallest coherent implementation pass and refactor only while green.
- Test public behavior and contracts: inputs, outputs, persisted state, authorization, emitted events, and failure modes. Do not couple tests to private implementation details unless the boundary itself is internal and stable.
- Use deterministic clocks, random sources, process runners, filesystem roots, and network clients through injection or test fixtures. Tests must not modify a real user profile or reach a real service by accident.
- Cover unhappy paths deliberately: invalid input, absent data, conflicts, permission denial, cancellation, duplicate delivery, partial persistence, data integrity failures such as a duplicate or orphaned reference, error cascades where one dependency failure propagates through a call chain, and integration/contract drift such as a third-party version change or a replayed webhook. A happy-path-only test is not a boundary test.
- Keep unit tests fast and focused; use integration tests when framework wiring, a real serializer, SQL dialect, transaction, or authorization pipeline is the thing being proven.

## Deliver with evidence

- Run the narrowest relevant checks first, then the required broader gates. Read the exit code and relevant output; do not claim success from a stale run.
- Review the diff for accidental files, secrets, compatibility changes, and generated output. Confirm that documentation and migration behavior match any public contract change.
- Report what changed, the checks actually run, omitted checks, and residual risks. If a check is blocked by authority or environment, say so plainly rather than treating it as a pass.
- Do not embed a plan ID, phase number, criterion ID, or check ID in a code comment, test name, migration name, or commit message; explain the invariant or behavior directly so it stays meaningful after the task record that produced it is gone.

## Work efficiently across tool calls

- Batch independent reads, searches, and checks into one turn instead of serializing them one at a time.
- Read a file once and keep what you learned; re-read only the part that actually changed rather than the whole file, to refresh a stale assumption.
- Extract the relevant lines from a large command or tool output before carrying it forward; do not restate a dump you already have.
- Run the narrowest test first and broaden only when a shared contract changed. Never repeat an identical failed command without changing something first; a second identical failure is evidence, not a reason to retry.
