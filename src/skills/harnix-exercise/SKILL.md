---
name: harnix-exercise
description: Use when an implemented behavior must be proven by running it for real, by calling an API endpoint, running a CLI or driving a browser with generated test cases and recorded evidence.
metadata:
  version: "2.38.3"
---

# Exercise the behavior for real

Turn acceptance criteria into scenarios, run the real thing, and record what happened as evidence. A unit test that passes proves the code compiles against itself; this proves the behavior.

## Evidence and Rationale

Code written and reviewed by the same agent shares its assumptions, so its own tests miss the same bugs. Running the application, calling the endpoint or opening the page exposes wiring, contract and environment faults that isolated tests cannot see. Reporting exactly what was run keeps a skipped check from passing as a green one.

## When to use

- A criterion describes behavior a user or caller can observe: an HTTP response, a command's output, a page flow, a library call.
- The task changes a route, handler, command, UI or public API and the existing tests only exercise internals.
- Not for pure refactors with unchanged behavior, docs-only edits or code with no runnable entry point.

## Procedure

1. **Scenarios.** From each acceptance criterion (and the contract or route code it names) list a happy path, one boundary and one error case. Never invent behavior the criteria and contract do not state; ask when they are silent.
2. **Detect the kind and the tools.** Decide API, CLI, web or library from manifests and entry points, then check which tools are present before choosing one. Never install anything without the user's agreement.
3. **Write the test.** Put it in the project's own test tree, with its existing framework, tagged with the check id (`[chk-id]`). One scenario per test, assertions on observable results, no fixed sleeps.
4. **Start under control.** Declared port, readiness probe, timeout, isolated data (temporary database, fixtures, mocks), child processes always cleaned up, executable plus argument array, no shell string built from untrusted text.
5. **Run and record.** Run it with `harnix workflow --run-check <id> -- <exe> [args...]` so the inputs are snapshotted and the outcome persisted. Repeat a passing run a few times before trusting it; a flaky result goes to `harnix skill harnix-flaky-test`.
6. **Report the mode.** State what actually ran: `full` (real process exercised), `partial` (some scenarios or a mock in place of the real dependency) or `code-only` (nothing ran). Never present `code-only` as a runtime pass.

## Rules

- Production data, credentials and real third-party services are out of bounds; use isolated environments.
- Never print or store a secret, token or personal data in an artifact.
- A scenario that writes or deletes data runs only against an isolated target and after the user agrees.
- A failing scenario is evidence: keep it, route a real defect to `harnix skill harnix-debug`, and do not weaken the assertion.
- Missing tool or environment: degrade one level, say so, and record the unverified part as a residual risk.

Detail on demand:

- Project kind, tool detection, degrading: `harnix skill harnix-exercise --reference detection`
- Recording and trusting a result: `harnix skill harnix-exercise --reference evidence`
- Calling an API for real: `harnix skill harnix-exercise --reference api`
- Running a CLI or a library as its consumer: `harnix skill harnix-exercise --reference cli`
- Driving a browser through a page flow: `harnix skill harnix-exercise --reference web`
- The repository's own start and probe notes, and how to propose them: `harnix skill harnix-exercise --reference runbook`
- Limits that always apply (isolation, secrets, ports, installs): `harnix skill harnix-exercise --reference safety`
