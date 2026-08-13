# React web engineering guide

## Render purity and state ownership

- Keep components and Hooks pure during render: the same props, state, and context should produce the same JSX without mutating inputs or performing I/O. Rendering may run more than once or be interrupted.
- Put side effects in event handlers when caused by a user action; use effects for synchronization with an external system, with a clear dependency list and cleanup. Do not use an effect as a general-purpose place to derive render state.
- Treat props and state as immutable snapshots. Use state setters/reducers to create the next state rather than mutating an object or array that was read during render.
- Keep state as local as possible, lift it only to the nearest shared owner, and avoid duplicate sources of truth. Use context for stable cross-cutting dependencies, not as an unstructured global store.

## Web correctness and accessibility

- Use semantic HTML before custom widgets. Provide labels, correct button/link behavior, keyboard support, focus management, and clear loading/error/empty states.
- Treat browser input and API responses as untrusted. Client validation improves feedback but cannot authorize an operation or replace server-side validation.
- Avoid rendering raw HTML. If the product requires it, sanitize for the exact HTML context and document the trust model; never assume a CMS or API is safe by default.
- Keep route/data transitions race-safe. Cancel or ignore stale requests where the client supports it, surface recoverable errors, and avoid optimistic updates without rollback/reconciliation behavior.

## Performance and testing

- Profile before optimizing. Keep render pure and props stable first; introduce memoization only when measurement shows a meaningful repeated cost, because memoization adds its own contract and invalidation surface.
- Split code at meaningful route/feature boundaries, avoid unnecessarily large dependencies in client bundles, and measure production-like builds rather than relying on development timing.
- Test through user-observable behavior with Testing Library or the repository equivalent: accessible queries, input, keyboard interaction, rendered states, and outcomes. Avoid tests tied to component internals or implementation-specific Hook calls.
- This guide is for React web applications. Do not apply browser DOM, accessibility, routing, or bundle assumptions to React Native projects.
