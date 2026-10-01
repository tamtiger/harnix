# TypeScript guide

## Verify

```text
tsc --noEmit
eslint .
prettier --check .
vitest run
```

Use `jest` instead of `vitest run` when the repository uses Jest.

## Constraints

- Keep `strict: true` in `tsconfig.json`; do not weaken it to pass a build.
- Use `unknown` plus a runtime parser (such as zod) for external data; never cast it with `as`.
- Avoid `any`, `@ts-ignore` and non-null `!`; use `@ts-expect-error` with a reason only when unavoidable.
- Model variants as discriminated unions and end `switch` with an exhaustive `never` check.
- Use `import type` for type-only imports; keep ESM/CJS settings consistent with `package.json` `type`.
- Await or handle every promise (`@typescript-eslint/no-floating-promises`); use `Promise.all` for independent work.
- Pass `AbortSignal` or a timeout to `fetch` and long-running calls.
- Throw `Error` subclasses with `cause`; never throw strings.
- Keep exported function signatures explicit; do not export mutable module state.

## Common mistakes

- Casting `JSON.parse` output instead of validating it.
- Passing an `async` callback to `forEach` and expecting it to be awaited.
- Using `Object.keys` results as typed keys without a guard.
- Mocking modules so heavily the test no longer exercises real behavior.
