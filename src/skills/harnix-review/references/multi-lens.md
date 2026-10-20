# Multi-lens review

Optional: split one large or risky review into independent lenses, each read-only. Use it for a wide diff, a security or boundary change, or a release. A small diff needs one pass. Subagents are never required: where the platform has none, run the lenses one after another yourself, using the same briefs.

## Brief template

Fill the angle brackets and send one brief per lens. Do not add your own conclusion or hypothesis: an agent given one tends to confirm it.

```text
Review the change in <repository>: <scope, for example `git diff HEAD -- src` plus the untracked files of `git status --short`>.
Purpose of the change: <one sentence>. Project rules that apply: <for example file size and complexity limits, no absolute paths in output>.
Read-only: do not edit files; do not run git stash, checkout, reset, commit or push; no command that writes state. Reading files, `git diff` and one focused test file are fine.
Lens: <one lens block below>
Known and out of scope: <what is already known and intentionally left, or "nothing">
Report only defects you verified in the code, most severe first, each as: `file:line`, the defect, the input or state that triggers it and the wrong result, a minimal fix. Drop what you cannot confirm; write "no finding" for an area with none. Under 60 lines.
```

## Lens blocks

1. **Source:** correctness of the changed code against HEAD. For every refactor compare old and new semantics. Check error and edge handling, async correctness, Windows versus POSIX differences, dependency direction, and the size and complexity limits.
2. **Tests:** a test that still passes when the fix is removed, vacuous or weak assertions, coupling to the host (OS, PATH, git, cwd, timing), duplicated coverage, important behavior with no test, and the repository's test rules.
3. **Docs vs code:** open the code for every claim a changed document makes (flag names, defaults, error text, limits). Find statements the new behavior contradicts, generated copies that differ from their templates, and disagreement between documents.
4. **Security:** trust boundaries (untrusted repository content, file names, tool output), path and process handling, injection, information disclosure, resource exhaustion, and anything that lets different content count as fresh evidence.
5. **Release and state:** version numbers and changelog agree everywhere, Harnix task and epic data are valid and complete, no temporary file or secret is staged, and every criterion marked met has its change.

## After the reports

- Reviewers can be wrong: confirm each finding in the code (reproduce it or read the exact lines) before acting; discard and say so for one that does not hold.
- Merge duplicates and rank by severity. Report as one review: findings, verdict, scope, omitted checks, residual risk.
- This profile stays read-only. A fix is a tracked change handed to `harnix-plan`; independent reviews can run again after it.
