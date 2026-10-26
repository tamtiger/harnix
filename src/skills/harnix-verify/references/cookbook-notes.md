# Command cookbook notes

Shell, encoding and envelope notes behind the Command cookbook of `.harnix/workflow.md`; the rarer command forms are in
`harnix skill harnix-verify --reference cookbook-commands`.

- **Where to run:** from the repository root; `workflow`, `mem` and `skill` also find the nearest `.harnix` from any
  subfolder, including a nested Git repository, and name the initialized child projects when run above them.
  Multi-repository workspaces: `harnix skill harnix-plan --reference multi-repo`.
- **Encoding:** accented text must never go through a Windows PowerShell 5.1 pipe or `-File` script: it reads UTF-8 as
  ANSI and prepends a BOM, which corrupts the task and is rejected; `<` redirection does not work in PowerShell either.
  Use the flag transports (`--set-*`, `--add-*`, `--run-check`), edit `prd.md`, `plan.md` and `design.md` directly, and
  load JSON with `--file <path>` (a Bash heredoc into a pipe can fail with `unexpected EOF`, and a Windows PowerShell 5.1 pipe encodes as ANSI and corrupts UTF-8) (for example `.harnix/tmp/payload.json`, valid for `--init`, `--save`, `--batch` and
  `--migrate`) or bash / `pwsh` 7.4+, where JSON on stdin under 64 KiB is accepted. Prefer `pwsh` 7.4+ on Windows.
- **`--save`:** the envelope is in the `agent-transport` reference; use it only for new tasks, task text or research, start from the
  `activeTask` of `harnix workflow --inspect` and follow the `constraints` of `harnix workflow --schema` (no unknown fields). It reports every
  independent problem at once, so fix them together.
  `--init --mode full` writes the `prd.md` and `plan.md` templates; refine them with the editor, since the ready gate
  checks them.
- **Shell forms:** double-quote text in PowerShell and single-quote it in bash when it contains backticks or `$`. In
  PowerShell: `$pf = harnix workflow --preflight | ConvertFrom-Json`; to parse a command's JSON assign it first:
  `$out = harnix workflow --inspect | Out-String; $j = $out | ConvertFrom-Json`. In bash:
  `now=$(harnix workflow --preflight | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).clock.now")` and
  `printf '%s' "$json" | harnix workflow --save --brief`. Never pipe `harnix` into a nested `pwsh -Command` (it waits for
  stdin until the timeout). List flags (`--criteria`, `--criterion`, `--evidence-ids`, `--check`) accept `a,b` or a
  repeated flag; `--input` and `--relevant-path` repeat.
- **`--run-check`** runs one executable with an argument array; for `a && b` declare one check per command or start a
  shell (`-- bash -c "a && b"`). On Windows a bare name resolving to an `.exe` or `.com` on `PATH` is launched directly;
  a `.cmd`/`.bat` shim, or a name not on `PATH`, goes through `cmd.exe`, which refuses `&`, `|`, `<`, `>`, `^`, `%` and
  `"` in arguments, so give the shell its extension or a full path (`-- pwsh.exe -NoProfile -Command "pnpm lint && pnpm test"`).
- **Other flags:** `--evidence` needs `--exit-code` for any command-backed check; `--brief` prints `id`, `status`,
  `checkpoint`, `updatedAt` (plus `evidenceId`); `--init --epic <epic-id>` attaches an existing epic from the start
  (never retroactively); `--slug <english-kebab-case>` is required when the title is not plain ASCII (IDs are English,
  titles, goals and criteria Vietnamese); `--follow-up <task-id>` records `followUpOf`, inherits the parent's epic and
  paths, and prints a `notice:` when the parent has no epic.
