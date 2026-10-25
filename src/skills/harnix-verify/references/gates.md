# Gate detail

Detail behind the Gates section of `.harnix/workflow.md`.

- **Ready:** at least one criterion and one required check; every non-waived criterion is covered by a required check; a project-level suite check covering source and tests is required when the
  repository has tests (wildcard inputs, or a source tree plus a test tree such as `src/**` + `test/**` or `Foo.Api/**` + `Foo.Api.Tests/**`) whose `command` is the project test command from
  `harnix verify-plan` (a command that runs only part of the tests, such as one test file, is rejected). A Full task has non-empty `prd.md` and `plan.md` with at least one `- [ ]` item. Entering
  `ready/ready` also checks the plan text: no hard placeholder tokens (`TBD`, `TODO`, `FIXME`, `???`, `<placeholder>`) outside code, every criterion id named in `plan.md`, and a focused required check
  for each criterion (the suite check does not count); a Full task must repeat the transition with `--reviewed` after the ready-review, and `--dry-run` prints `reviewChecklist`. A task already at
  `ready/ready` is not re-checked. A task that changes the CLI, documentation or test structure should add the focused required check `pnpm run test:gates` (contract tests in seconds). Details:
  `./references/ready-review.md` (or `harnix skill harnix-plan --reference ready-review`).
- **Contract immutability:** never change a criterion mapped by recorded check evidence; checks with a pass remain immutable and check failures are retired unchanged with a replacement required check
  ID. A check edit at `verifying` (`--set-check`, `--replace-check`, `--add-criterion`) resumes at `verifying/verifying` in the same call because every recorded pass stays immutable; elsewhere it
  stays at checkpoint `replan` until `ready/ready`.
- **Red baseline:** when the suite was already red before the task and outside its scope, the user authorizes it once with
  `harnix workflow --set-baseline <check-id> --result fail --classification pre-existing|environment --authorized-by user --scope "<why>"` (review data: no `--reason`, no replan). Finish then accepts
  that suite check without a fresh pass only while its latest run is that red result and another passing required check covers all of its criteria; `introduced`, `unknown`, a missing authorizer or a
  missing focused proof keep the default suite gate. Harnix does not compare a test delta (which tests newly fail) because that needs per-test identity and reports falsely; the focused proof carries
  the deliverable.
- **Execute:** persist `in_progress/implementing` before the first product edit; tick the Full checklist per slice (passing checks with `harnix workflow --run-check` or `--evidence` automatically tick items tagged with `[<chk-id>]`), 100% before verifying; release preparation (version, changelog, generated output)
  belongs here. Version policy: a standalone task bumps the patch once, a member of an epic bumps the pre-release `X.Y.0-dev.N` once, the last member by ID closes the epic with a minor release (a
  major only for a frozen-contract break); the implementing agent bumps with `pnpm version:sync` before `verifying` (the epic-closing minor adds `--fold-dev` to merge the `X.Y.0-dev.N` changelog
  entries into one), and the script rejects any other pre-release shape. In the Harnix repository itself run `pnpm selfhost:sync` after editing this template.
- **Verify:** persist `verifying/verifying` before the first check. Two stages: compliance, then quality and security. A required pass is fresh only when its `inputDigest` equals the digest recomputed from the current inputs. The digest covers the task id, check id, the check's own contract (mode, its own definition, the id and text of the criteria it covers; other checks never affect it, and a digest recorded under the former formula is still recognised while the whole task contract is unchanged) and the sha256 of each matched file (CRLF is read as LF in text files, except shell scripts, batch files, Makefiles and Dockerfiles; `--snapshot` also returns `rawInputDigest`, and evidence recorded under it or under the former formula stays fresh); it omits the active task's own `task.json` and `review.md`, and `prd.md`/`plan.md` count only when declared. It skips `.git`, `node_modules`, `TestResults`, `.vs`, `.idea`, `.harnix` and build output next to its build marker.
- **Finish:** only from `verifying/finishing` with every criterion `met` or `waived` and every required check fresh; `harnix workflow --finish` recomputes every latest required digest. Finish is
  product-read-only. Cancellation is a separate terminal path on explicit user instruction with `harnix workflow --cancel --reason <why>` (or stdin JSON) (`./references/finish-cancel.md` or `harnix skill harnix-verify --reference finish-cancel`).
- **Convergence:** one automatic remediation round; an identical check, digest, exit code and summary is the strongest stop signal; three failed hypotheses for one symptom mean replan.
- **Commit discipline:** never commit, branch, push, publish or open a pull request without showing the changes and message and getting approval.
