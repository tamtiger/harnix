# Epics

Use when an initiative, refactor or chain of work has two or more tasks, or the user asks to link work to a larger initiative. An epic is mandatory then; never invent an `epicId` for a single standalone task.

1. IDs: English only (`--init` takes `--slug <english-kebab-case>`; titles, goals and criteria stay Vietnamese with accents): `YYYYMMDD-HHMMSS-<name>` from `clock.idPrefix`, for the epic and every task (task IDs must match `^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$`). Members run in ID order: `harnix epic` lists them and picks the next task by ID, and `--save` rejects members whose IDs do not increase in the order you declare them. Give each member a later idPrefix than the one before it (add one second per member), the first task first.
2. Create the epic and all member tasks up front in one `--save` envelope: `epic` (`id`, `title`, `goal`, optional `nonGoals`, plus `generator`, `schemaVersion: 1`, `createdAt`, `updatedAt`), the first task with `epicId`, and every other member in `epicMembers` (schema v3, status `planning`, same `epicId`).
3. `.harnix/epics/<epic-id>/epic.json` is task-owned data; `<epic-id>/epic.md` is derived and regenerated on save (automatically migrated and backward-compatible with flat `.harnix/epics/<epic-id>.json`). The epic folder also holds initiative-level supporting artifacts such as `research.md` (or `research/` for cross-task discovery) and `spec.md` (architecture design, domain models or data contracts); these Markdown artifacts are task-owned, preserved across workflow updates, and never overwritten by CLI generation (when present, `epic.md` auto-links them under `## Supporting Artifacts`). Never hand-edit `epic.json` or `epic.md`.
4. Inspect with `harnix epic` (list) or `harnix epic <epic-id>` (members and the next task). When the epic is created or ready, stop for user review (`nextStage: await`): present the member sequence and scope to the user and wait for approval before running the first task. When a member finishes, report the epic's progress and recommend the next member.
5. The flag transports (`--set-check`, `--add-criterion`, `--set-paths`, `--add-decision`, `--add-risk`, `--batch`) act on the active task unless you add `--task <task-id>` to edit another unfinished member (for example a `planning` epic member) without touching the active pointer; every rule applies to it unchanged (`--reason` after planning, immutability, the workflow lock). `--task` is refused with `--transition`, `--finish`, `--cancel`, `--run-check` and `--evidence`, and for a completed or cancelled task: those act only on the active task.
6. Legacy `.harnix/roadmaps/` is read and migrated by `harnix update`; the `roadmap` command and `roadmapMembers` field no longer exist.
7. A later task of the same initiative is created with `harnix workflow --init ... --epic <epic-id>`, never with `--follow-up` alone: `--follow-up <task-id>` records the optional `followUpOf` and inherits the parent's epic and relevant paths only (a `notice:` on stderr says when the parent has none). An epic is never attached retroactively to a task that already exists, and a completed task is terminal, so decide the epic at creation.
8. Reconcile member tasks with code: Member tasks created up front have draft criteria and checks. Before activating and marking a member task `ready`, inspect the actual repository code: verify findings against existing tests/contracts, sanity-check that referenced test files still exist (prior tasks may have refactored or deleted them), and adjust criteria or checks before freezing obligations.

## Run order

Members run in ID order unless the epic declares an optional `order` (task ids, distinct, all members of the epic). `harnix workflow --epic-order <epic-id> <task-id>...` sets it (no task ids clears it) and rewrites only the epic record and its page, never a `task.json`. `harnix epic <epic-id>` lists the ordered members first in that order and the rest by ascending ID, and `nextTask` is the first unfinished member in that sequence; an epic without `order` behaves as before.

## Branching and task switching flow

1. **Git Awareness**: `harnix status` and `harnix workflow --preflight` surface read-only `git: { branch, clean, commit }`. Inspect `git.branch` before implementing to ensure you are operating on the expected base or feature branch.
2. **Branching Strategy**:
   - Establish a clean base branch (e.g. `main`, `develop`, or an epic feature branch `feat/epic-<id>`).
   - For isolated task development or parallel sub-workspaces, branch off the common base: `git checkout -b feat/<task-id> <base-branch>`.
3. **Task Switching & Stash Discipline**:
   - When switching tasks (`harnix resume <other-id> --force` or `harnix resume --next`):
   - Check `git.clean`. If `false`, never leave uncommitted modified files across task boundaries.
   - Use `git stash push -m "WIP: <task-id>"` (or request user approval to commit verified progress) before switching.
   - Upon resuming the task: checkout the task branch and run `git stash pop`.
4. **Divergence Handling**:
   - When the base branch moves ahead during a multi-task epic, rebase or merge the base branch cleanly before final verification and closing.

## Multi-Agent Worktree Orchestration and State Reconciliation

For initiatives where member tasks are executed concurrently across isolated Git worktrees:

1. **Isolation Architecture**:
   - Every concurrent subagent operates in its own dedicated Git worktree (`.harnix/worktrees/<task-id>` on branch `feat/<task-id>`).
   - This ensures file edits do not collide and `inputDigest` verification inputs remain stable and valid during check execution.
2. **State Reconciliation & Conflict Avoidance**:
   - **Active Pointer (`.harnix/tasks/.active`)**: Do not commit `.active` on task worktree branches. Subagents keep `.active` uncommitted or clear it prior to requesting a merge, using task-scoped branch workflows so the active pointer is not part of the PR/merge diff.
   - **Derived Epic Artifact (`epic.md`)**: Do not commit derived `epic.md` from subagent branches. The Lead Agent (Orchestrator) regenerates `epic.md` from the main integration branch after merging member task branches (`harnix epic <epic-id>`).
   - **Task Records (`.harnix/tasks/<task-id>/**`)**: Safe to commit directly. Each task resides in its own isolated directory, guaranteeing clean 3-way git merges without conflict.
3. **Orchestrator Protocol (6-step lifecycle)**:
   - Step 1 (DAG Analysis): Lead Agent analyzes `epic.json` and selects independent tasks with disjoint `inputs`.
   - Step 2 (Worktree Setup): Create worktree for each subagent: `git worktree add .harnix/worktrees/<task-id> -b feat/<task-id> HEAD`.
   - Step 3 (Subagent Delegation): Launch subagents (via host runner or subagent tools) targeted to their worktree.
   - Step 4 (Task Execution): Subagents run TDD cycle using focused commands and record evidence.
   - Step 5 (Verification & Handoff): Subagents verify all checks (`exitCode 0`, valid `inputDigest`) and report `evidenceId`.
   - Step 6 (Integration & Cleanup): Lead Agent verifies task record, merges `feat/<task-id>` into the base branch, removes the worktree (`git worktree remove .harnix/worktrees/<task-id>`), and refreshes Epic status.
