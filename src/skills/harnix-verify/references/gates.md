# Gate detail

Detail behind the Gates section of `.harnix/workflow.md`.

- **Ready:** at least one criterion and one required check; every non-waived criterion is covered by a required check; a project-level suite check covering source and tests is required when the
  repository has tests (wildcard inputs, or a source tree plus a test tree such as `src/**` + `test/**` or `Foo.Api/**` + `Foo.Api.Tests/**`) whose `command` is the project test command from
  `harnix verify-plan` (a command that runs only part of the tests, such as one test file, is rejected). A Full task has non-empty `prd.md` and `plan.md` with at least one `- [ ]` item and repeats
  the transition with `--reviewed` after the ready-review (`--dry-run` prints `reviewChecklist`). What entering `ready/ready` rejects (placeholders, criterion ids missing from `plan.md`, a criterion
  without a focused required check) and the review itself: `harnix skill harnix-plan --reference ready-review`. A task already at `ready/ready` is not re-checked. A task that changes the CLI, docs or
  test structure adds the focused check `pnpm run test:gates`.
- **Contract immutability:** rewriting a criterion whose check recorded evidence needs `--reason` and turns those passes stale; checks with a pass remain immutable and check failures are retired unchanged with a replacement required check
  ID. A check edit at `verifying` (`--set-check`, `--replace-check`, `--add-criterion`) resumes at `verifying/verifying` in the same call because every recorded pass stays immutable; elsewhere it
  stays at checkpoint `replan` until `ready/ready`.
- **Red baseline:** when the suite was already red before the task and outside its scope, the user authorizes it once with
  `harnix workflow --set-baseline <check-id> --result fail --classification pre-existing|environment --authorized-by user --scope "<why>"` (review data: no `--reason`, no replan). Finish then accepts
  that suite check without a fresh pass only while its latest run is that red result and another passing required check covers all of its criteria; `introduced`, `unknown`, a missing authorizer or a
  missing focused proof keep the default suite gate. Harnix does not compare a test delta (which tests newly fail) because that needs per-test identity and reports falsely; the focused proof carries
  the deliverable.
- **Execute:** persist `in_progress/implementing` before the first product edit; tick the Full checklist per slice (a passing check recorded by `--run-check` or `--evidence` ticks its `[<chk-id>]` items), 100% before verifying; release preparation (version, changelog, generated output)
  belongs here. Version policy: a standalone task bumps the patch once, a member of an epic bumps the pre-release `X.Y.0-dev.N` once, the last member by ID closes the epic with a minor release (a
  major only for a frozen-contract break); the implementing agent bumps with `pnpm version:sync` before `verifying` (the epic-closing minor adds `--fold-dev` to merge the `X.Y.0-dev.N` changelog
  entries into one), and the script rejects any other pre-release shape. In the Harnix repository itself run `pnpm selfhost:sync` after editing this template.
- **Verify:** persist `verifying/verifying` before the first check. Two stages: compliance, then quality and security. A required pass is fresh only when its `inputDigest` equals the digest recomputed from the current inputs; the digest is bound to the task id and check id. What the digest covers and skips: `harnix skill harnix-verify --reference evidence`; it omits the active task's own `task.json` and `review.md`, and `prd.md`/`plan.md` count only when declared.
- **Finish:** only from `verifying/finishing` with every criterion `met` or `waived` and every required check fresh; `harnix workflow --finish` recomputes every latest required digest. Finish is
  product-read-only. Cancellation is a separate terminal path on explicit user instruction with `harnix workflow --cancel --reason <why>` (or stdin JSON) (`./references/finish-cancel.md` or `harnix skill harnix-verify --reference finish-cancel`).
- **Convergence and commit discipline:** as in the sheet (the `evidence` reference details convergence).
