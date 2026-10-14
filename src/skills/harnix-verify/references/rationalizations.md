# Anti-rationalizations table

Lookup table to recognize and refute common rationalizations that attempt to avoid running real tests, soften acceptance criteria, or claim premature completion.

## Core principle

**Evidence precedes claims.** No claim of success or completion is accepted without a real command execution yielding exit code 0 and a fresh `inputDigest` matching the current file state.

## 8 Rationalization pairs: Excuse vs Harnix reality

| # | Common rationalization | Harnix reality and discipline |
|---|---|---|
| 1 | "It's just a one-line change / tiny diff, it cannot break anything." | A single wrong line can break control flow, corrupt state, or crash at runtime. Running actual verification and recording exit code 0 is mandatory. |
| 2 | "Code looks obviously correct on inspection; tests are unnecessary." | Visual inspection is blind to side effects, race conditions, type edge cases, and runtime environments. Only execution results constitute proof. |
| 3 | "Tests passed in an earlier step; no need to rerun before finish." | Any edit to inputs alters `inputDigest`. Prior evidence immediately becomes `stale`. The finish gate rejects mismatched snapshots. |
| 4 | "The full test suite takes too long; running a local unit test is enough." | A focused test verifies the slice, but the full suite guards against global regression. Both are required in the validation plan. |
| 5 | "This test failure is flaky or pre-existing environmental noise." | Never assume or ignore failures. If a failure is genuinely pre-existing or out-of-scope, obtain user consent to record `--set-baseline`; never ignore it silently. |
| 6 | "Relax or remove assertions to get the suite green quickly." | Moving goalposts is testing fraud. Never weaken, relax, or delete existing tests to mask defects in new code. |
| 7 | "I tested it manually outside and verified it works." | The only acceptable verification is recorded through `harnix workflow --run-check` with atomic input snapshots before and after execution. |
| 8 | "This edge case is rare in practice; we can skip it." | Every committed acceptance criterion must reach `met` with real evidence, unless explicitly `waived` with rationale by user authorization. |

## Mandatory response when rationalizations arise

- Stop immediately before claiming completion without fresh green evidence.
- Execute the exact check via `harnix workflow --run-check <id> -- <command>`.
- If existing tests lack coverage, add explicit boundary and edge-case tests before transition.
