# Epic Git flow and multi-agent worktrees

Branching, task switching and concurrent members of an epic; the epic rules themselves are in the `epic` reference.

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
