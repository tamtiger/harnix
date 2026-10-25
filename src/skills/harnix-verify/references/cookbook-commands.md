# Less common commands and command details

The Command cookbook in `.harnix/workflow.md` lists the everyday forms; this page holds only the rarer forms and the
details that sheet leaves out, so nothing is repeated. `harnix workflow --schema --full` describes every flag.

```text
harnix workflow --evidence --check <check-id> --result pass --exit-code 0 --summary "<command> - <result>" --brief   # record a run made outside --run-check (one check id)
harnix workflow --set-baseline <check-id> --result fail --classification pre-existing --authorized-by user --scope "<why the suite is red>" --brief   # authorized red suite; pair it with a focused required check
harnix workflow --remove-decision <id> --brief   # planning only; --remove-criterion <id> likewise (refused after planning or once a check recorded evidence)
harnix workflow --epic-order <epic-id> <task-id>...   # explicit run order of an epic's members
harnix workflow --schema --full              # the envelope schema plus the description of every flag
```

- `--run-checks` runs every required check that is not passing (focused first, suite last) with its declared command
  and prints `{ ran, remaining }`; a failing check carries a short `outputTail`, a launcher error is "could not start"
  and records nothing. A check that failed twice in a row runs again once its inputs change (a new input digest).
- `--run-check` snapshots, runs and records; its argv must equal the declared command and it runs in the declared
  `cwd`.
- `--criterion <ids> --met --transition verifying/finishing --finish` marks criteria, advances and finishes in one call.
- `--reset-breaker` needs a `--reason` of 10-1000 characters and the user's authorization; it is the only way to
  record a breaker reset.
- `--batch` is atomic and order does not matter: references between items resolve after all are applied.
- `harnix status --summary` stays under 80 tokens (stage, epic progress, criteria, checks, next action);
  `harnix status --criteria` lists id, status, text and coveredBy of each criterion.
- `harnix resume --next` activates the next unfinished member of the active epic; `harnix resume <id> --force` switches
  task and pauses the active one.
