# Recording and trusting a runtime result

## Recording

- Declare one required check per behavior group: `--set-check` or `--with-check` with the command that starts, drives and stops the target, and `inputs` covering the source and the test files.
- Run it with `harnix workflow --run-check <id> -- <exe> [args...]`. The argument array must equal the declared command; a pipeline needs `-- bash -c "a && b"`.
- Write the command so its exit code is the verdict: non-zero on any failed assertion, a timeout or a target that never became ready.
- Name the declared check so ready can see it: an id or description that starts with `exercise` (for example `exercise-orders-api`); `harnix workflow --transition ready/ready --dry-run` adds an advisory for an observable criterion that no required `exercise` check covers.
- Start the evidence summary with `mode: full`, `mode: partial` or `mode: code-only`. A criterion that describes observable behavior and reached only `code-only` gets a residual risk (`harnix workflow --add-risk <id> --text <t>`), never a plain pass.
- Keep artifacts small and local to the task: response bodies, command output, screenshots, traces. Name them after the check id and redact secrets, tokens and personal data before saving.

## Trusting a pass

- Repeat the run (3 to 5 times) before the first recorded pass for anything involving a process, a port, time or a browser. A mixed result is a flaky test, not a pass: stabilize it with `harnix skill harnix-flaky-test`.
- A pass must come from a run where the target was really started; a run that skipped its scenarios exits non-zero, not zero.
- Never mark a check `skipped` as a pass. If the target could not run, record the check as failed or leave it pending and report the degraded mode.
- A check that failed twice in a row stops further evidence until its inputs change; fix the cause instead of rerunning.

## Quarantine

Do not silence a failing scenario with a skip or an expected-fail marker. If it must be set aside, record why in a residual risk with the criterion it leaves unproven, so it stays visible at verify.

## What to report

Mode (`full`, `partial` or `code-only`), the commands run, the scenarios covered per criterion, what was mocked, what was not verified and why. Reuse a current pass when its input digest still matches instead of running it again.
