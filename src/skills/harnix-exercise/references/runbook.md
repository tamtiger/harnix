# The exercise runbook of a repository

`.harnix/spec/exercise.md` is a user-owned file: how this repository starts, probes and stops the thing you exercise. `harnix verify-plan` returns `runbook` when it exists and has content; read it first and follow it over any guess. No command creates or rewrites it.

## Template

Copy this shape, fill what applies, delete the rest. Never put a secret, token or personal data in it.

```markdown
# Exercise runbook

- Kind: API | CLI | web | library
- Start: <executable and arguments, run from the repository root>
- Ready when: <URL or log line to wait for, with a timeout>
- Port: <declared port, or how to pick a free one>
- Tools: <test runner or browser tool already installed, with the command that proves it>
- Data: <temporary database, fixtures or mocks; never production>
- Stop: <how the process is ended and cleaned up>
- Known traps: <ordering, locale, slow first run, flaky step>
```

## Proposing it

After the first run that really started the target and passed, offer once to save the commands you used as this file: show the proposed text and write it only when the user agrees clearly. Without agreement, record nothing and keep going; `harnix doctor` reminds a project that has a runnable entry point and no runbook.
