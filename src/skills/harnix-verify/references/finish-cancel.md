# Finish, recovery and cancellation

**Finish** (only from `verifying/finishing` with current prerequisites):
1. Confirm `harnix workflow --inspect` still returns this task at `verifying/finishing` and release preparation is already inside the verified inputs; if not, set checkpoint `replan` and go through `harnix-plan` without touching product files.
2. Run `harnix workflow --finish --brief` once. It recomputes the digest of every latest required pass from the current inputs, persists `completed/finishing`, writes the completion journal entry, captures learning and clears only the matching active pointer. Never write `completed`, the journal or `.active` yourself.
3. Any edit after the final evidence (editor autosave, format-on-save) legitimately makes that check stale; the error names the evidence id and paths. Rerun the check; timestamps alone prove nothing.
4. A partial failure leaves `completed/finishing`; rerun `--finish` to recover, do not use another path.

**Learning:** `--finish` reads the task's own `decisions`, `residualRisks` and evidence `findings` (credential-like, instruction-override and command-like text is never captured; at most 5 per task). Write reusable lessons as self-contained sentences with `--add-risk` / `--add-decision`. A repeated observation becomes a `candidate`; unpromoted entries lapse after 28 days. Promotion into a spec is manual and reviewed. `--learn` is only for a candidate you author with two completed source tasks and two evidence ids.

**Cancel** (only on explicit user instruction, with a short non-secret reason; ambiguous "complete" must be clarified first):
1. Confirm the intended unfinished task with `--inspect` (or `cancelled/cancelling` for recovery).
2. Send `{ "reason": <text>, "authorizedBy": "user" }` on stdin to `harnix workflow --cancel`; recovery calls need no body. It writes `cancelled/cancelling`, a cancellation journal entry and clears the matching pointer last. Criteria and evidence are preserved; no completion gate runs.
3. Report the task as cancelled and incomplete, never completed.
