# Command cookbook notes

Shell, encoding and envelope notes behind the Command cookbook of `.harnix/workflow.md`.

Multi-repository workspaces: `harnix skill harnix-plan --reference multi-repo`. Run from the repository root; `workflow`, `mem` and `skill` also find the nearest `.harnix` from any subfolder, including a nested Git repository, and name the initialized child projects when run above them. To safely load complex UTF-8 payloads, write to a payload file (such as `.harnix/payload.json` or `.harnix/tmp/payload.json`) and use `--file <path>`. Never patch `task.json`, `review.md` or `.active` directly with regex or text editors.
Accented text (for example Vietnamese) must never go through a Windows PowerShell 5.1 pipe or a `powershell -File` script: it reads UTF-8 files as ANSI and prepends a BOM, which corrupts the task and is rejected. Change checks, criteria and paths with the flag transports (`--set-*`, `--add-*`, `--run-check`), edit `prd.md`, `plan.md` and `design.md` directly with the editor tool, and use `--file <path>` or bash / `pwsh` 7.4+ when JSON is unavoidable. `<` redirection does not work in PowerShell, so use `--file`. In bash or `pwsh` 7.4+, JSON on stdin under 64 KiB is accepted.

A `--save` envelope is `{ "task": <TaskRecord v3>, "artifacts"?: { "prd": "...", "plan": "..." } }`. Read `harnix workflow --schema` once per session (its `constraints` list the enums, the
sorted-unique arrays and the `--brief` commands) and build it right the first time rather than discovering the shape by failing: no unknown fields; every criterion carries `id`, `text`, `status`,
`evidenceIds: []`; each check `scope` is `focused` or `full` (never `project`); a required check needs non-empty `criterionIds` and `inputs`, both sorted and unique. A `--save` reports every
independent problem at once, so fix them together. A Full task created with `--init --mode full` automatically generates structured 4-block `prd.md` and Execution Slices `plan.md` templates; write or refine them directly with the editor tool afterwards, since the ready gate enforces them.

The commands are the same in both shells; double-quote text in PowerShell and single-quote it in bash when it contains backticks or `$`:

The command list is in `harnix skill harnix-verify --reference cookbook-commands`.


Only JSON on stdin and the clock differ. To avoid stdin piping issues (e.g. Windows PowerShell ANSI encoding corruption or Bash heredoc unexpected EOF), use `--file <path>` with `--init`, `--save`, `--batch` or `--migrate` to load raw UTF-8 JSON/YAML files directly. In PowerShell: `$pf = harnix workflow --preflight | ConvertFrom-Json`, `harnix workflow --save --file .harnix/payload.json --brief` and
`harnix workflow --cancel --reason "<why>"`. In bash: `now=$(harnix workflow --preflight | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).clock.now")`,
`printf '%s' "$json" | harnix workflow --save --brief` and `harnix workflow --cancel --reason "<why>"`. To read JSON from a command in PowerShell, assign the
output first and parse it: `$out = harnix workflow --inspect | Out-String; $j = $out | ConvertFrom-Json`. Never pipe `harnix` into a nested `pwsh -Command` (it waits for stdin until the timeout). List
flags such as `--criteria`, `--criterion`, `--evidence-ids` and `--check` accept `a,b` or a repeated flag; `--input` and `--relevant-path` repeat. On Windows, prefer PowerShell 7.4+ (`pwsh`) over
Windows PowerShell 5.1, or use `--file <path>`. `--save` is only for new tasks, task text or research; start from `harnix workflow --inspect`.

Notes: `--run-check` runs one executable with an argument array; for a compound command such as `a && b` declare one check per command or start a shell explicitly (`-- bash -c "a && b"`). On Windows a bare name that resolves to an `.exe` or `.com` on `PATH` is launched directly (a `|` in an argument is just an argument); a `.cmd`/`.bat` shim, or a name not found on `PATH`, goes through the system `cmd.exe`, which refuses `&`, `|`, `<`, `>`, `^`, `%` and `"` in arguments, so give the shell its extension or a full path, for example `-- pwsh.exe -NoProfile -Command "pnpm lint && pnpm typecheck && pnpm test"`. `--evidence` needs `--exit-code` for every pass or fail and for any command-backed check. `--brief` prints only `id`, `status`, `checkpoint`, `updatedAt` (plus `evidenceId`). `--init --epic <epic-id>` attaches the new task to an existing epic from the start (an epic is never attached retroactively); `--slug <english-kebab-case>` sets the English slug of the task ID and is required when the title is not plain ASCII (task and epic IDs are English; titles, goals and criteria are Vietnamese with accents); `--follow-up <task-id>` records `followUpOf` and inherits the parent's epic and relevant paths, and prints a `notice:` on stderr when the parent has no epic.
