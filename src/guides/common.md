# Common engineering guide

## Verify

```text
harnix verify-plan
```

Run the commands it prints and read every exit code. Do not guess verify commands.

## Constraints

- Read repository instructions, the active task and the nearest tests before editing; existing conventions are the contract.
- Parse and validate every boundary input (HTTP, queue, file, env var, command output, DB row, LLM or tool output) once, at the boundary.
- Keep secrets, tokens and machine-specific paths out of errors, logs and generated output.
- Use parameterized queries and argument arrays; never build SQL or shell commands from strings.
- Narrow destructive actions (delete, overwrite, reset) to exact paths or ids; preserve unrelated user changes.
- Track every process you start and stop it before finishing.
- Write the failing test first; keep clocks, randomness and I/O deterministic or injected.
- Do not retry non-idempotent writes without an idempotency key; set timeouts on network and subprocess calls.
- Never embed plan, criterion or check IDs in code comments or test names.
- Batch independent tool calls in one step.

## Common mistakes

- Claiming success without a fresh exit code 0 from the verify command.
- Fixing adjacent problems instead of the requested outcome.
- Swallowing an error or logging it without operation context.
- Mocking the unit under test instead of its dependency.
