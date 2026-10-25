# Complete command list

Every `harnix workflow` command form; the lean sheet in `.harnix/workflow.md` lists the common ones.

```text
harnix status --summary                      # micro status projection under 80 tokens (stage, epic progress [m/n], criteria, checks, next action)
harnix status --criteria                     # lean-token projection of acceptance criteria (id, status, text, coveredBy) without whole task dump
harnix workflow --preflight                  # clock.now and clock.idPrefix are the only time source
harnix workflow --init --title "<task title>" [--mode lite|full] [--goal "<goal>"] [--text "<criterion>"]... [--with-check "id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>"]... [--command "<cmd>"] [--input "src/**"] [--epic <epic-id>] [--follow-up <task-id>] [--cwd <package-dir>] --brief
harnix workflow --transition ready/ready --dry-run --brief
harnix workflow --transition ready/ready --reviewed --brief   # a Full task, only after the ready-review
harnix workflow --run-checks --brief                       # verify, main path: runs every required check that is not passing (focused first, suite last) with its declared command, stops at the first failure, prints { ran, remaining } (a failing check carries a short outputTail, a launcher error is "could not start" and records nothing)
harnix workflow --run-check <check-id> --brief -- pnpm test    # snapshot, run, snapshot and record; argv must equal the declared command and runs in the declared cwd
harnix workflow --evidence --check <check-id> --result pass --exit-code 0 --summary "<command> - <result>" --brief
harnix workflow --criterion <criterion-id>,<criterion-id> --met [--transition verifying/finishing] --brief   # marks criteria, optionally advances transition in one call
harnix workflow --tick <item>                # mark plan.md checklist items completed (- [x]) by index (1-based), 'all', or pattern
harnix workflow --reset-breaker <check-id> --reason "<why, 10-1000 characters>" --brief # reset circuit breaker for a check without renaming (or rerun with changed input digest)
harnix workflow --replace-check <old-check-id> <new-check-id> --reason "<why, required>" [--description "<text>" --command "<cmd>" --scope focused --input "src/**" --criteria <criterion-id> --cwd <path>] --brief
harnix workflow --set-baseline <check-id> --result fail --classification pre-existing --authorized-by user --scope "<why the suite is red>" --brief   # authorized red suite; pair it with a focused required check
harnix workflow --transition verifying/finishing [--finish] --brief  # advances transition, optionally finishes in one call
harnix workflow --set-check <check-id> --description "<text>" --scope focused --command "<command>" [--cwd <path>] --criteria <criterion-id> --input "src/**" --reason "<why, 10-1000 characters, required after planning>" --brief
harnix workflow --add-criterion <criterion-id> --text "<criterion text>" --check <check-id> --reason "<why>" --brief
harnix workflow --set-criterion <criterion-id> --text "<new text>" [--reason "<why, required after planning>"] [--task <id>] --brief   # rewrite one criterion (a criterion mapped by recorded evidence stays immutable)
harnix workflow --set-title "<new title>" --brief
harnix workflow --set-goal "<new goal>" --brief
harnix workflow --set-paths --relevant-path <path> --relevant-spec <path> --brief
harnix workflow --save --file <path> --brief   # safe UTF-8 file load without stdin piping issues
harnix workflow --batch [--file <path>] --brief              # atomic batch of criteria, checks, decisions, risks, paths from stdin or file; references between items resolve after all are applied, so order does not matter
harnix workflow --add-decision <id> --text "<self-contained lesson>" --rationale "<why>" --brief
harnix workflow --add-risk <id> --text "<reusable risk or trap>" --severity medium [--mitigation "<text>"] --brief
harnix workflow --remove-decision <id> --brief   # planning only; --remove-criterion <id> likewise (refused after planning or once a check recorded evidence)
harnix resume --next                         # select and activate the next unfinished task in the active epic
harnix resume <id> --force                   # switch task, pausing any currently active task automatically
harnix skill <name> --raw                    # print raw Markdown skill text directly without JSON envelope
harnix workflow --finish --brief
```
