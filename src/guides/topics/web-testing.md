# Web testing guide

## Verify

```text
vitest run --coverage
npx playwright test
npx cypress run
```

## Constraints

- Test behavior through the user's perspective via accessible roles and text (`getByRole`, `getByLabelText`, `getByPlaceholderText`), never internal DOM tags or CSS classes.
- Use explicit deterministic locators and auto-waiting assertions (`toBeVisible()`, `toHaveText()`); avoid arbitrary `sleep()`, `setTimeout()`, or fixed delay waits.
- Keep test data isolated per test run; generate unique identifiers or database seeds, never depend on execution order or shared state.
- Isolate external boundary dependencies (third-party payment gateways, analytics, mailers) at network boundaries (`page.route()`, MSW) while testing internal APIs end-to-end.
- Mock external network calls cleanly; assert error boundaries, loading spinners, network timeouts, and offline recovery flows.
- Make end-to-end tests idempotent: reset browser storage, indexedDB, cookies, and local session between test cases.
- Write readable failure diagnostics: test assertions must fail with informative descriptions and include DOM snapshots or traces on failure.
- Test keyboard interactions and accessibility pathways with real synthetic event dispatches (`userEvent.keyboard`, `page.keyboard`), not synthetic mouse clicks.

## Common mistakes

- Querying elements by unstable CSS selectors, IDs, or internal component class names (`.btn-primary-2`).
- Hardcoded sleeps and race conditions instead of waiting for explicit response promises or DOM state changes.
- Asserting implementation details (private component state or internal helper calls) instead of visible user outcomes.
- Shared mutable test data causing intermittent cross-test flakes when tests run in parallel.
- Over-mocking UI layers to the point where tests pass but integration breaks in real browsers.
