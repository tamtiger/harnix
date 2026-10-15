# Scouting isolation and subagent protocol

Protocols for isolated codebase scouting, context containment, and standardized delegation status reporting.

## 1. Context isolation

When delegating a research task, scouting a foreign subsystem, or spawning an auxiliary subagent:
- Never dump full conversation history or entire repository manifests into the delegate context.
- Provide only the minimal required inputs:
  1. Exact task description and specific goal.
  2. Targeted files and directories to inspect.
  3. Acceptance criteria and concrete deliverables.
  4. Explicit constraints and non-goals.
  5. Isolated output destination for notes or reports.

## 2. Standardized status protocol

Every delegated research or scouting report must conclude with an unambiguous status block:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: <1-2 sentences capturing findings or result>
Concerns/Blockers: <specific risks, broken invariants, or missing information>
```

### Handling status outcomes:
- **`DONE`**: The scouting or investigation succeeded completely. Incorporate findings directly into planning or debugging.
- **`DONE_WITH_CONCERNS`**: Completed, but identified subtle dependencies, performance bottlenecks, or test gaps. Record these in residual risks.
- **`BLOCKED`**: Hard stop due to environment error, missing permissions, or broken dependencies. Do not retry the failing prompt blindly; adjust strategy or fix environment.
- **`NEEDS_CONTEXT`**: Ambiguous requirements or conflicting architecture patterns found. Formulate specific clarification choices for the user.
