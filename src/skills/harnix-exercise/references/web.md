# Driving a browser through a page flow

Open the page in a real browser, walk the main flow of the criteria, and record what the browser reports. Read `safety` first: the run is isolated and read-only unless the user agrees otherwise.

## Observe, then act

1. Start the app on a declared port and wait for the readiness probe.
2. Open the page and wait until it is stable (the app's own ready signal, a visible element, or `networkidle` for a simple app); never a fixed sleep.
3. Observe before acting: take a screenshot or read the accessibility snapshot or DOM, and pick selectors from what is actually rendered.
4. Act with those selectors, then assert the visible result (text, URL, element state), not internals.

Selectors, best first: role and accessible name, `data-testid`, visible text, then CSS. Avoid positional XPath. If the app lacks stable hooks, say so as a finding rather than coupling the test to layout. Wait for conditions (an element, a response), never for a duration.

## Tool order

Detect, never install unasked (`harnix skill harnix-exercise --reference detection`):

1. **The browser test tool the project already uses** (Playwright, Cypress or similar): write the test in its own tree.
2. **A browser CLI for agents such as agent-browser**, optional: it takes a snapshot of interactive elements with refs (take a new snapshot after navigation) and needs a browser download on first use, so ask the user first.
3. **The platform's own browser tool**, when the agent platform has one.
4. **Nothing available** (Cursor and Kiro have no browser tool): write the tests, report `code-only` or `partial`, and record a residual risk that the page flow was not run. Do not claim a pass.

## What to capture

- Console errors (ignore known analytics noise explicitly, never silently).
- Network responses with a 4xx or 5xx status and failed requests.
- A screenshot at the key steps and at any failure, for desktop width and one narrow width.
- Optionally an accessibility scan; it covers only part of the guidelines, so a clean scan is not a claim of accessibility.

A page with a console error or a failed request on the main flow fails the check unless the criteria say it is expected.

## Safety in the browser

- Flows that write data (submit, pay, delete) run only on an isolated target and after the user agrees. Default to read-only flows.
- Use test accounts created for the run; never real credentials.
- Redact personal data, tokens and secrets from screenshots, traces and logs before saving.

## Flaky results

Repeat a passing run 3 to 5 times before recording it. A mixed result is a flaky test: stabilize it with `harnix skill harnix-flaky-test` (waits on conditions, isolated state) rather than retrying until green or skipping it; the circuit breaker stops a check that fails twice in a row.

## Mode to report

`full` when the browser ran the flow, `partial` when only part ran or a dependency was mocked, `code-only` when no browser ran. Record what stayed unverified as a residual risk. Evidence recording follows `evidence`.
