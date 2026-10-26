# Epics

Use when an initiative, refactor or chain of work has two or more tasks, or the user asks to link work to a larger initiative. An epic is mandatory then; never invent an `epicId` for a single standalone task.

1. IDs: English only (`--init` takes `--slug <english-kebab-case>`; titles, goals and criteria stay Vietnamese with accents): `YYYYMMDD-HHMMSS-<name>` from `clock.idPrefix`, for the epic and every task (task IDs must match `^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$`). Members run in ID order: `harnix epic` lists them and picks the next task by ID, and `--save` rejects members whose IDs do not increase in the order you declare them. Give each member a later idPrefix than the one before it (add one second per member), the first task first.
2. Create the epic and all member tasks up front in one `--save` envelope: `epic` (`id`, `title`, `goal`, optional `nonGoals`, plus `generator`, `schemaVersion: 1`, `createdAt`, `updatedAt`), the first task with `epicId`, and every other member in `epicMembers` (schema v3, status `planning`, same `epicId`).
3. `.harnix/epics/<epic-id>/epic.json` is task-owned data; `<epic-id>/epic.md` is derived and regenerated on save (a flat `.harnix/epics/<epic-id>.json` is migrated). The folder may also hold task-owned initiative notes such as `research.md` (or `research/`) and `spec.md`, never overwritten by the CLI and linked from `epic.md` under `## Supporting Artifacts`. Never hand-edit `epic.json` or `epic.md`.
4. Inspect with `harnix epic` (list) or `harnix epic <epic-id>` (members and the next task). When the epic is created or ready, stop for user review (`nextStage: await`): present the member sequence and scope to the user and wait for approval before running the first task. When a member finishes, report the epic's progress and recommend the next member.
5. The flag transports (`--set-check`, `--add-criterion`, `--set-criterion`, `--set-paths`, `--set-title`, `--set-goal`, `--add-decision`, `--add-risk`, `--remove-decision`, `--remove-criterion`, `--remove-risk`, `--batch`) and `--inspect` act on the active task unless you add `--task <task-id>` to edit or read another unfinished member (for example a `planning` epic member) without touching the active pointer, under the same rules (`--reason` after planning, immutability, the workflow lock); `--transition`, `--finish`, `--cancel`, `--run-check` and `--evidence` act only on the active task, and a finished task refuses `--task`.
6. Legacy `.harnix/roadmaps/` is read and migrated by `harnix update`; the `roadmap` command and `roadmapMembers` field no longer exist.
7. A later task of the same initiative is created with `harnix workflow --init ... --epic <epic-id>`, never with `--follow-up` alone (`--follow-up` only records `followUpOf` and inherits the parent's epic and paths; a `notice:` on stderr says when the parent has none). An epic is never attached retroactively to an existing task, so decide it at creation. To add a member while another task is active, create it with `--init --epic <epic-id> --no-activate`, which leaves `.active` where it is.
8. Members created up front carry draft criteria and checks: before marking one `ready`, check them against the current code, tests and contracts (earlier members may have moved or deleted files) and adjust them before they freeze.

## Run order

Members run in ID order unless the epic declares an optional `order` (task ids, distinct, all members of the epic). `harnix workflow --epic-order <epic-id> <task-id>...` sets it (no task ids clears it) and rewrites only the epic record and its page, never a `task.json`. `harnix epic <epic-id>` lists the ordered members first in that order and the rest by ascending ID, and `nextTask` is the first unfinished member in that sequence; an epic without `order` behaves as before.

## Branching and task switching flow

1. **Git awareness:** `harnix status` and `harnix workflow --preflight` surface read-only `git: { branch, clean, commit }` (`clean` stays true when tracked files differ from HEAD only in line endings, CRLF/LF). Check `git.branch` before implementing so you work on the expected base or feature branch.
2. **Branches:** work from a clean base (`main`, `develop` or an epic branch `feat/epic-<id>`); for isolated work branch off it: `git checkout -b feat/<task-id> <base-branch>`.
3. **Switching tasks** (`harnix resume <other-id> --force` or `harnix resume --next`): when `git.clean` is `false`, never carry uncommitted files across tasks; `git stash push -m "WIP: <task-id>"` (or ask the user to approve a commit of verified progress) first, and on return check out the task branch and `git stash pop`.
4. **Divergence:** when the base moves ahead during an epic, rebase or merge it cleanly before final verification.

## Multi-Agent Worktree Orchestration and State Reconciliation

For member tasks run concurrently by subagents, each in its own Git worktree:

1. **Isolation:** one worktree per subagent (`.harnix/worktrees/<task-id>` on branch `feat/<task-id>`), so edits never collide and `inputDigest` inputs stay stable while checks run.
2. **What to commit:** never `.harnix/tasks/.active` on a task branch (keep it uncommitted or clear it before the merge) and never the derived `epic.md` (the lead agent regenerates it on the integration branch with `harnix epic <epic-id>`); task records under `.harnix/tasks/<task-id>/` are safe, since each lives in its own folder and merges cleanly.
3. **Lead agent lifecycle:** (1) pick independent tasks with disjoint `inputs` from `epic.json`; (2) `git worktree add .harnix/worktrees/<task-id> -b feat/<task-id> HEAD`; (3) launch a subagent on that worktree; (4) it runs the TDD cycle and records evidence; (5) it reports its `evidenceId`s once every check passes (`exitCode 0`, valid `inputDigest`); (6) the lead verifies the task record, merges `feat/<task-id>`, runs `git worktree remove .harnix/worktrees/<task-id>` and refreshes the epic.
