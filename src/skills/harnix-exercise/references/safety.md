# Limits that always apply

Running things for real has side effects. These limits hold for every kind of run.

## Isolation

- Use a temporary database, throwaway fixtures, mocks or an in-memory mode. Never point a run at production or at a shared environment, and never at real third-party services that charge, send messages or change someone else's data.
- A scenario that writes, updates or deletes data runs only against an isolated target, and only after the user agrees. Read-only scenarios are the default.
- Seed test accounts with test credentials created for the run; never reuse a real login.

## Secrets and personal data

- Never read, print, log or store a secret, token, connection string or personal data in an artifact, a check summary or a report. Redact them from saved bodies, logs and screenshots before they are written.
- Pass secrets to the target through the environment of that one process, never on a command line that is logged.

## Processes and ports

- Use a declared port (or ask the operating system for a free one and read it back), never an assumed one.
- Give every start a readiness probe and every run a timeout.
- Always clean up child processes, temporary directories and listeners, including when the run fails or is interrupted.
- Launch with an executable plus an argument array; build no shell string from untrusted text.
- Keep runs from writing outside the repository and its temporary directory.

## Asking first

Ask the user before anything that changes their machine or leaves it: installing a tool or downloading a browser, opening a listener beyond localhost, calling an external network service, or running a scenario that mutates data. Describe what will happen and offer the degraded alternative.

## Platforms

Every instruction must work on Windows and POSIX: use the platform's real executable names, avoid shell-only syntax in the check command, and treat paths and line endings as platform-dependent when comparing output.

## When a limit blocks the run

Do not relax a limit to make a run possible. Degrade to `partial` or `code-only` (see `detection`), say which limit blocked it, and record the unverified behavior as a residual risk.
