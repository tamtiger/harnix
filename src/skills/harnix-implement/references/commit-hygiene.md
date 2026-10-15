# Commit and diff hygiene

Rules for inspecting diffs, preparing commit proposals, and maintaining clean git history.

## 1. Inspect actual diffs

Never guess what changed. Run git diff or inspect staged changes directly before drafting a commit proposal. Verify that:
- No temporary debug logs, print statements, or scratch files leaked into source trees.
- No unintended formatting or whitespace churn exists across unchanged functions.
- All touched files directly correspond to the task scope.

## 2. Conventional commit structure

Structure proposed commit messages with standard conventional types (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`):
- A concise summary line under 72 characters explaining *what* changed.
- A bulleted body explaining *why* the change was necessary and any non-obvious design decisions.

## 3. Strict user approval gate

Harnix Rule 6 strictly mandates: Never auto-commit, branch, push, or open a pull request autonomously. Always display the complete list of modified files and proposed commit message to the user and wait for explicit approval.
