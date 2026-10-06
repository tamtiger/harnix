# Multi-repository tasks

Use when one task spans a workspace of several repositories or nested projects that each build and test on their own.

1. **When a check needs `cwd`:** the repository root is not where the command must run (for example `dotnet test` or `pnpm test` of a child repository). A check with no `cwd` runs at the Harnix project root.
2. **Find the commands:** run `harnix verify-plan --recursive`. It lists the test, lint and typecheck commands per package and per nested repository; copy the exact command string for the package you verify.
3. **Declare the check with its `cwd`:** `harnix workflow --set-check <id> --scope full --command "<cmd>" --input "<repo>/**" --criteria <ac-ids> --cwd <repo>`. The `cwd` is a repository-relative path inside the project; a path that leaves the project is rejected. After planning, `--set-check` also needs `--reason <10-1000 characters>` and makes the single guarded replan save.
4. **Run it without `--cwd`:** `harnix workflow --run-check <id> -- <exe> [args...]` runs only the declared `command` in the declared `cwd`. Passing `--cwd` or a different argv is refused, so a pass can never come from another directory or command.
5. **Example, two repositories:**
   - `check-api`: `--command "dotnet test" --cwd services/api --input "services/api/**" --criteria ac-1`
   - `check-web`: `--command "pnpm run test" --cwd apps/web --input "apps/web/**" --criteria ac-2`
   Run `--run-check check-api -- dotnet test`, then `--run-check check-web -- pnpm run test`.
6. **Common mistakes:**
   - `inputs` that do not cover the repository under `cwd` (the pass would never go stale).
   - A compound command (`cd x && y`); declare one check per command and use `cwd`.
   - Retrying a check that failed twice in a row; it refuses evidence until a user-authorized `--replace-check` whose `command`, `inputs` or `cwd` differs.
   - Changing a check after `ready` without `--reason`.
