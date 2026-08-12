# Workflow self-hosting improvement

## Problem

Harnix can persist task state in runtime code, but its generated workflow and globally installed skills are too terse for an agent operating only from consumer-project instructions. They say to record or persist work without making stage preconditions, persistence boundaries, and exit conditions explicit. A self-hosting run also showed that an empty project profile can occur even when relevant source exists, so config detection cannot be treated as complete repository truth.

The research helper additionally omits the remaining uncertainty that the research skill requires.

## Outcome

An initialized project must provide enough concise guidance for one agent to:

1. restore or create exactly one task;
2. persist planning before product edits;
3. cross each state gate explicitly;
4. discover current repository evidence without bulk-loading code;
5. record research conclusion and uncertainty;
6. finish only from fresh recorded evidence.

## Constraints

- Preserve TaskRecord v1, ContextManifest v1, and the seven-command public CLI.
- Keep the generated workflow concise and platform-independent.
- Do not add automatic Git operations, network calls, daemon/watch behavior, or mandatory delegation.
- Treat task/research/journal data as user-owned.

## Acceptance criteria

The normative criteria are recorded in `task.json`. No repository scanner implementation is part of this task.
