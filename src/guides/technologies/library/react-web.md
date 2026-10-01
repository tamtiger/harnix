# React guide

## Verify

```text
tsc --noEmit
eslint .
vitest run
```

## Constraints

- Use function components and hooks; enable `eslint-plugin-react-hooks` (`rules-of-hooks`, `exhaustive-deps`) as errors.
- Call hooks only at the top level, never in conditions, loops or after an early return.
- Keep render pure: no fetches, mutations or `Date.now()`/`Math.random()` in the render body.
- Derive values during render; do not mirror props into state with `useEffect`.
- Never mutate state or props; create new objects and arrays.
- Give list items a stable unique `key`, not the array index for reorderable lists.
- Return cleanup from `useEffect` for subscriptions, timers and listeners; abort in-flight requests with `AbortController`.
- Add `useMemo`/`useCallback`/`React.memo` only after measuring; split routes with `React.lazy` and `Suspense`.
- Use labelled controls and semantic elements; avoid `dangerouslySetInnerHTML` with untrusted content.

## Common mistakes

- Stale closures from missing effect dependencies.
- Setting state during render, causing loops.
- Using `useEffect` for logic that belongs in the event handler.
- Creating context values inline, re-rendering all consumers.
- Testing implementation details instead of user-visible behavior.
