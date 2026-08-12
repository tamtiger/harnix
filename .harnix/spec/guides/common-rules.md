# Harnix common engineering rules

- **Repository conventions:** inspect the nearest project instructions, existing architecture, build scripts, and tests before changing code; follow established naming and dependency direction.
- **Scope and ownership:** keep changes limited to the stated acceptance criteria. Preserve unrelated edits, generated/user-owned data, and public compatibility unless the task explicitly changes them.
- **Boundaries:** validate external input at the edge, keep I/O and side effects explicit, propagate cancellation/timeouts, and return actionable errors without leaking secrets or machine paths.
- **Behavior changes:** add a focused failing regression test first when practical, implement the smallest coherent fix, then refactor only while the checks stay green.
- **Acceptance and verification:** run the narrowest meaningful checks first, then the required broader gate. Report actual commands, exit codes, omitted checks, and residual risk; stale output is not evidence.
- **Security and operations:** do not log credentials or sensitive payloads, concatenate untrusted shell input, silently call network services, or perform destructive/external actions without authority.
