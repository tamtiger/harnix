# Detecting the kind of project and the tools

Pick the cheapest signal first; stop when one kind has clear evidence. Never ask the user for a fact the repository answers.

Runbook first: when `harnix verify-plan` returns `runbook` (`.harnix/spec/exercise.md`, a user-owned file with the start command, port and tools of this repository), read it before choosing a kind or a tool and follow it; without that file, detect as below.

## Kind

| Signal in the repository | Kind |
| --- | --- |
| OpenAPI or Swagger file, route or controller classes, a framework that serves HTTP (Express, Fastify, ASP.NET, Spring, FastAPI, Gin) | API |
| `bin` entry in a manifest, `main` that parses arguments, a command framework (Commander, Cobra, Click, System.CommandLine) | CLI |
| A dev server script plus components, pages or templates; a UI framework dependency | web |
| Only exported modules, no entry point that runs on its own | library |

- Several kinds match (a web app with an API): exercise each kind the changed code touches, API first.
- No clear signal: take the kind with the strongest evidence, say which assumption you made and why, and continue; ask only when two kinds are equally likely and the choice changes the safety of the run.

## Tools

Check presence with a read-only version or help command (executable plus `--version`), never by installing.

| Kind | Prefer | Then | Last |
| --- | --- | --- | --- |
| API | the project's own HTTP test support | a plain-text request file runner, then a schema-driven fuzzer when an OpenAPI file exists | a short script using the runtime already on the machine |
| web | the browser test tool the project already declares | a browser CLI for agents, with the user's agreement before it downloads a browser | the platform's own browser tool, if it has one |
| CLI | run the built command and assert stdout, stderr and exit code | | a wrapper script |
| library | a script that imports the package the way a consumer would | | |

A tool the project does not already use is optional: name it, say what it needs, and let the user decide. Do not make the skill depend on one tool.

## Degrading

Move down exactly one level at a time and report each step:

1. `full`: the real process or page was exercised.
2. `partial`: part of the flow ran, or a mock replaced a dependency; list what was mocked.
3. `code-only`: nothing ran (no tool, no safe environment, no permission). Write the tests anyway, mark the behavior as not verified at runtime and add a residual risk.

Platforms without a browser tool still follow this ladder; they stop at `partial` or `code-only` for web work rather than pretending.

## When no safe target exists

If every runnable target is shared or production-like, do not run it. Use an isolated copy, a mock or recorded fixtures; otherwise report `code-only` and the exact condition that blocked the run.
