# Self-hosting workflow gap

- Task: 20260812-134438-workflow
- Source: local `.harnix/workflow.md`, generated global skill templates, TaskRecord v1 runtime, and the 2026-08-12 self-hosting run
- Researched: 2026-08-12

## Conclusion

Keep the existing state schemas and seven public commands. Improve the generated workflow and skills so persistence boundaries and state-specific responsibilities are explicit. Treat config language/package detection as a starting hint and require current repository evidence before selecting task context.

## Remaining uncertainty

Whether concise generated instructions alone are sufficient for every host agent must be tested through platform adapter fixtures and a fresh initialized-project self-hosting fixture. A task CLI should be reconsidered only if those tests demonstrate an unresolved state-validity failure.
