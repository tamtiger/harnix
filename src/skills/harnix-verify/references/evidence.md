# Evidence and freshness

- **One command:** `harnix workflow --run-check <id> -- <exe> [args...]` snapshots the check's inputs, runs the executable (no shell), snapshots again and records pass (exit 0) or fail only when the digests are equal. Output is returned as `outputTail` and never stored. For a compound command such as `a && b`, declare one check per command or start a shell explicitly (`-- bash -c "a && b"`, full path on Windows).
- **Manual form:** `harnix workflow --snapshot --check <id>` before and after a non-mutating run; record a pass only when both `inputDigest` values match, with `--evidence --check <id> --result pass --exit-code 0 --summary <text> --digest <before>`. An empty glob, missing or unreadable input, or unsafe path is failed freshness evidence, not a warning.
- **Summary shape:** command, then result, then any note.
- **`recordedAt`** comes from the CLI clock; never write your own time.
- **What changes `inputDigest`:** a file matched by the check's `inputs`, or the task contract (criterion ids/text, mode, the definition of any check). Not: recording evidence, criterion `status`/`evidenceIds`, ticking `plan.md`, decisions, residual risks. `.git`, `node_modules`, `TestResults`, `.vs`, `.idea`, `.harnix` and build output next to a build marker are skipped.
- **Stale reasons:** `digest-mismatch`, `evidence-expired`, `inputs-unavailable`, `latest-failed`, `latest-skipped`, `legacy-schema`, `no-evidence`. `harnix status --explain` lists them without running anything.
- **Convergence:** inspect state once; reuse a matching pass; one automatic remediation round; an identical check/digest/exit/summary fingerprint is the strongest stop signal; skipped or future-dated evidence never resets the breaker, only a current valid pass does.
- **Criteria:** link a criterion only to current passing evidence whose check lists it in `criterionIds`.
- **Suppress noise:** do not report readability-only redundancy, requests for comments on thresholds, consistency-only reshaping, harmless no-ops, linter-enforceable style, or anything the diff already fixes.
