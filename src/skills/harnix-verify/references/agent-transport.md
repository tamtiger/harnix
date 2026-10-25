# Agent transport detail

Detail behind the Agent transport section of `.harnix/workflow.md`.

Hidden `harnix workflow` is the only persistence transport; it is not a supported public API and always prints one JSON document.

- `--preflight` (no write; `baselineHint` is one line that appears while implementing or verifying when the same suite was red in the last two finished tasks: ask the user to authorize
  `--set-baseline`, never set it yourself; adds a short `versionSkew` string only when the `harnix` on PATH is older than the version recorded in `.harnix/.template-hashes.json`, in which case newer
  gates may be missing: tell the user and, only if they allow, rebuild and reinstall the repository's CLI; `harnix doctor` reports the same as `cli-version-skew`): `activeTask`, `contextDrift`,
  `requiredChecks` (passed, failed, stale, pending), `retryLimitReached`, `nextStage`, `clock`, `learning` (only when `nextStage` is `plan`; `--preflight --brief` omits it). `--inspect` returns
  `{ activeTask, contextDrift }` and the base for an update. `--schema` prints the envelope and transports.
- `--save`: one bounded JSON envelope on stdin `{ task, artifacts?, contractRevision?, epic?, epicMembers? }`. `artifacts` holds only `prd`, `plan`, `design`, a `research` map keyed by safe `.md`
  names and a validated `context`. Saves are serialized by a project lock, compare captured bytes, validate the digest of any new required pass and commit `task.json` last. Needed only for new tasks,
  task text and research; use the flags below for everything else.
- `--transition <status>/<checkpoint>`: no body; moves the persisted record through one legal transition.
- `--evidence --check <id> --result <r> --summary <t> [--exit-code --artifact --digest]` (or a `{ "evidence": ... }` envelope): appends one item; id, `recordedAt` and digest are filled in. `--run-checks`: `--run-check` for every required check that is not passing. `--run-check <id> -- <exe> [args]`: snapshot, run without a shell (a bare name such as `dotnet` is resolved on `PATH`), snapshot, record. `--snapshot --check <id>`: read-only digest. `--criterion <ids> --met [--evidence-ids]` (supports action batching: can be combined with `--transition`, or `--transition verifying/finishing` with `--finish` in one call).
- `--set-check`, `--add-criterion --text --check`, `--set-paths` edit obligations and paths; after planning they need `--reason` and make one guarded replan save. `--add-decision`, `--add-risk` record review notes at any unfinished stage. `--task <task-id>` on these edit commands, on `--inspect` and on `--batch` edits another unfinished task (for example an epic member in `planning`) without changing the active pointer (`--transition <s>/<c> --dry-run --task <id>` also checks its ready conditions read-only); a real state change, evidence and finish refuse it. `--batch` applies criteria, checks, decisions, risks and paths atomically in one call from stdin. `--migrate` upgrades a legacy task. `--brief` trims output (the commands that accept it are listed in `harnix workflow --schema` under `constraints.brief`); `--finish --brief` also reports `learning { notes, captured, hint? }` and, when a task file shows a sign of a secret, `secretAdvisory` (paths and rule names only; files ignored by `.gitignore` are not scanned): tell the user, do not print or commit it.
- `--finish` and `--cancel` are the only terminal transports. `--learn` records a hand-authored candidate.
