# Epics

Use when an initiative, refactor or chain of work has two or more tasks, or the user asks to link work to a larger initiative. An epic is mandatory then; never invent an `epicId` for a single standalone task.

1. IDs: `YYYYMMDD-HHMMSS-<name>` from `clock.idPrefix`, for the epic and every task (task IDs must match `^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$`). Members run in ID order: `harnix epic` lists them and picks the next task by ID, and `--save` rejects members whose IDs do not increase in the order you declare them. Give each member a later idPrefix than the one before it (add one second per member), the first task first.
2. Create the epic and all member tasks up front in one `--save` envelope: `epic` (`id`, `title`, `goal`, optional `nonGoals`, plus `generator`, `schemaVersion: 1`, `createdAt`, `updatedAt`), the first task with `epicId`, and every other member in `epicMembers` (schema v3, status `planning`, same `epicId`).
3. `.harnix/epics/<epic-id>.json` is task-owned data; `<epic-id>.md` is derived and regenerated on save. Never hand-edit either.
4. Inspect with `harnix epic` (list) or `harnix epic <epic-id>` (members and the next task). When the epic is created or ready, stop for user review (`nextStage: await`): present the member sequence and scope to the user and wait for approval before running the first task. When a member finishes, report the epic's progress and recommend the next member.
5. The flag transports (`--set-check`, `--add-criterion`, `--set-paths`, `--add-decision`) edit only the active task. To edit another member, run `harnix pause`, then `harnix resume <task-id>`, make the edits, and `harnix pause` and `harnix resume <task-id>` back to the task you were on.
6. Legacy `.harnix/roadmaps/` is read and migrated by `harnix update`; the `roadmap` command and `roadmapMembers` field no longer exist.
