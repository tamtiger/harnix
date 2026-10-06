# JavaScript guide

## Verify

```text
eslint .
prettier --check .
node --test
```

Use the repository's runner (`vitest run` or `jest`) instead of `node --test` when one is configured.

## Constraints

- Pick one module system per package: `"type": "module"` in `package.json` for ESM, with explicit file extensions in relative imports.
- Use `===` and `const`/`let`; never `var`.
- Validate all external data (JSON, env, request bodies) before use; never trust the shape of `JSON.parse` output.
- Await or handle every promise; use `Promise.all` or `Promise.allSettled` for independent work.
- Pass `AbortSignal.timeout(ms)` to `fetch` and other network calls.
- Throw `Error` instances with `cause`; never throw strings or plain objects.
- Never use `eval`, `new Function` or `child_process.exec` with interpolated input; use `execFile` with an argument array.
- Do not mutate function arguments or shared module state; copy before changing.
- Add JSDoc types or a `// @ts-check` header on public APIs when there is no TypeScript.

## Common mistakes

- Using `forEach` with `async` callbacks and not awaiting the result.
- Comparing with `==` or relying on truthiness for `0` or empty string.
- Leaving timers, listeners or servers open so the process never exits.
- Reading `process.env` values as numbers or booleans without parsing.
- Leaving `console.log` in production code instead of a logger (enable `no-console`).
