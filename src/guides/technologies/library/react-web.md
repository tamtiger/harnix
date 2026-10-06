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
- Keep render pure: no fetches, mutations or `Date.now()`/`Math.random()` or `ref.current` access in the render body.
- Derive values during render; do not mirror props into state with `useEffect`; reset state on a prop change with a parent `key`.
- Never mutate state or props; create new objects and arrays.
- Give list items a stable unique `key`, not the array index for reorderable lists.
- Return cleanup from `useEffect` for subscriptions, timers and listeners; fetch server data with a cache library (TanStack Query, SWR) or loader, and abort raw effect fetches with `AbortController`.
- Add `useMemo`/`useCallback`/`React.memo` only after measuring; split routes with `React.lazy` and `Suspense` under an error boundary.
- Use labelled controls and semantic elements; avoid `dangerouslySetInnerHTML` with untrusted content.
- Treat `VITE_*`/`REACT_APP_*` values as public; keep session tokens in httpOnly cookies, not `localStorage`.

## Common mistakes

- Stale closures from missing effect dependencies or `setX(x + 1)` instead of `setX(x => x + 1)`.
- Setting state during render, causing loops.
- Using `useEffect` for logic that belongs in the event handler.
- Creating context values inline, re-rendering all consumers.
- Testing internals (state, hook calls, `container.querySelector`) instead of `getByRole`/label queries and `userEvent`.
- Un-awaited `userEvent` calls or `setTimeout` waits instead of `findBy*`/`waitFor`.
