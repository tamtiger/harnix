# React web engineering guide

## Component architecture, composition, and rendering boundaries

- Structure React applications following feature-driven modularity: colocate presentation components, state hooks, styling, types, and unit tests within domain feature folders (`src/features/<feature>/`).
- Embrace component composition over configuration: prefer slots, `children`, and compound component patterns rather than creating monolithic components with dozens of optional boolean props.
- Distinguish between presentational (dumb) components and container (smart) components: presentational components should focus purely on rendering UI from props and emitting events; container components manage data fetching, state integration, and routing.
- Keep components pure: component render functions must be pure functions with respect to props and state. Never perform side effects, start timers, or mutate external variables directly inside the component render body.
- Use `React.lazy()` and `Suspense` for route-based and heavy component code splitting to reduce initial JavaScript bundle sizes and ensure fast First Contentful Paint (FCP).

## Hooks, state management, and side effect discipline

- Master React's Hook rules: never call hooks inside loops, conditional statements, or nested functions. Always declare dependencies exhaustively in `useEffect`, `useCallback`, and `useMemo` dependency arrays; never suppress the `react-hooks/exhaustive-deps` linter rule.
- Eliminate `useEffect` anti-patterns: do not use `useEffect` to synchronize or calculate derived state that can be computed synchronously during rendering. Use `useMemo` only when computing expensive transformations on large arrays.
- Manage server-state and caching using dedicated libraries like TanStack Query (React Query) or SWR instead of manually storing fetched data in `useEffect` and `useState`. Server-state libraries automatically handle deduplication, background revalidation, stale cache invalidation, and race conditions.
- Choose client-state solutions intentionally: use local `useState`/`useReducer` for component-local UI state; use lightweight global state managers like Zustand for shared cross-component client state. Avoid putting entire application domains into a single unwieldy React Context to prevent massive re-render waterfalls.
- Leverage modern React 18+ concurrent primitives: use `useTransition` to mark non-urgent state updates, and `useDeferredValue` to keep UI inputs responsive while deferring computationally expensive child tree re-renders.

## Security, accessibility, and form validation

- Defend against Cross-Site Scripting (XSS): rely on React's automatic string escaping in JSX expressions. Never use `dangerouslySetInnerHTML` unless the HTML string has been sanitized rigorously with an authoritative client-side sanitizer such as DOMPurify.
- Enforce accessibility (a11y) standards: ensure all interactive elements are keyboard navigable (`tabIndex`), provide meaningful `aria-*` attributes for custom controls, ensure sufficient color contrast, and use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<dialog>`) instead of generic `<div>` wrappers with click listeners.
- Handle complex forms using controlled, type-safe form libraries like React Hook Form coupled with schema validators (Zod or Valibot). Avoid unnecessary component re-renders during keystroke typing by leveraging uncontrolled inputs with registered ref handlers.
- Secure client-side tokens and sensitive data: never store raw user passwords, secret API keys, or long-lived authentication tokens in unencrypted `localStorage` or `sessionStorage` where they are vulnerable to XSS exfiltration. Prefer `HttpOnly` SameSite cookies for session management.
- Handle component errors gracefully using React Error Boundaries (`ErrorBoundary`) around critical UI sections to catch runtime exceptions, display fallback UI, and log failure context without crashing the entire web application.

## Testing, performance, and tooling

- Write user-centric automated tests using React Testing Library and Vitest or Jest. Query DOM elements by accessible roles and text (`getByRole('button', { name: /submit/i })`) rather than CSS classes, IDs, or test-only attributes (`data-testid`), ensuring tests validate true user experience and accessibility.
- Avoid testing component internal implementation details or private hook state. Test observable outcomes: user inputs, state transitions, DOM updates, and mock API network calls.
- Mock network interactions reliably using Mock Service Worker (MSW) at the network layer rather than mocking internal fetch libraries or custom hook internals.
- Identify performance bottlenecks and redundant re-renders using the React DevTools Profiler. Apply `React.memo` judiciously on expensive leaf nodes where prop equality checks yield measurable performance gains.
- Configure ESLint with `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y` with strict settings in CI pipelines to maintain high code quality and accessibility compliance across the codebase.
