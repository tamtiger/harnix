# Agent transport detail

Detail behind the Agent transport section of `.harnix/workflow.md`.

It is not a supported public API.

- `--preflight` (no write) returns `activeTask`, `contextDrift`, `requiredChecks` (passed, failed, stale, pending),
  `retryLimitReached`, `nextStage`, `clock` and `learning` (only when `nextStage` is `plan`; `--brief` omits it);
  `versionSkew` matches `harnix doctor`'s `cli-version-skew` (the sheet says what to do with it and with `baselineHint`). `--inspect` returns
  `{ activeTask, contextDrift }` and the base for an update. `--schema` prints the envelope, the task fields and `constraints`; `--schema --full` adds the description of every flag.
- `--save`: one bounded JSON envelope on stdin `{ task, artifacts?, contractRevision?, epic?, epicMembers? }`. `artifacts` holds only `prd`, `plan`, `design`, a `research` map keyed by safe `.md`
  names and a validated `context`. Saves run under a project lock, validate the digest of any new required pass and commit `task.json` last; a write that
  lands between a command's read and its save makes the command retry from fresh state.
- `--transition <status>/<checkpoint>`: no body; moves the persisted record through one legal transition.
- `--evidence` appends one item (id, `recordedAt` and digest filled in), `--run-check`/`--run-checks` run and record (the `evidence` reference; `--run-checks` form and output: `cookbook-commands`), `--snapshot --check <id>` is a read-only digest, and `--criterion <ids> --met [--evidence-ids]` can be batched with `--transition verifying/finishing` and `--finish` in one call.
- `--set-check`, `--add-criterion --text --check`, `--set-paths` edit obligations and paths; after planning they need `--reason` and make one guarded replan save. `--add-decision`, `--add-risk` record review notes at any unfinished stage. `--task <task-id>` edits another unfinished task without moving the pointer (rules: `harnix skill harnix-plan --reference epic`; `--transition <s>/<c> --dry-run --task <id>` checks its ready conditions). `--batch` applies criteria, checks, decisions, risks and paths atomically in one call from stdin. `--migrate` upgrades a legacy task. `--finish --brief` also reports `learning { notes, captured, hint? }` and, when a task file shows a sign of a secret, `secretAdvisory` (paths and rule names only; files ignored by `.gitignore` are not scanned): tell the user, do not print or commit it.
- `--finish` and `--cancel` are the only terminal transports. `--learn` records a hand-authored candidate.
