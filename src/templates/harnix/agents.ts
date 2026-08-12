import type { PackageConfig } from "../../core/config/config.js";
import type { LanguageId } from "../../utils/detection.js";
import { packageVersion } from "../../version.js";

export interface AgentsProjectProfile {
  languages: readonly LanguageId[];
  packages: readonly Pick<PackageConfig, "path">[];
}

const languageLabels: Record<LanguageId, string> = {
  "csharp-dotnet-abp": "C#/.NET/ABP",
  go: "Go",
  "java-spring": "Java/Spring",
  php: "PHP",
  python: "Python",
  "react-web": "React web",
  "typescript-nestjs": "TypeScript/NestJS",
  vue: "Vue",
};

export function renderAgentsTemplate(profile: AgentsProjectProfile): string {
  return `# Project agent instructions

${renderHarnixAgentsBlock(profile)}
`;
}

function renderHarnixAgentsBlock(profile: AgentsProjectProfile): string {
  const languages = profile.languages.map((language) => languageLabels[language]).join(", ") || "not specified";
  const packagePaths = profile.packages.map(({ path }) => `\`${path}\``).join(", ") || "not specified";

  return `<!-- harnix:begin -->
## Harnix

- Version: ${packageVersion}.
- Role: project-local coding-agent harness for workflow state, task evidence, concise engineering guidance, and diagnostics.
- Scope: the Harnix CLI manages this project's .harnix lifecycle; this root AGENTS bootstrap and .harnix/workflow.md drive coding tasks. Platform integrations, when explicitly installed, are user-global and never project-local setup output.

## Project profile

- Languages: ${languages}.
- Package paths: ${packagePaths}.

Treat this profile as an initialization-time discovery seed. Verify current manifests, source, tests, and repository instructions before selecting bounded task context; do not bulk-load the repository.

## Harnix workflow

Use harnix --help or harnix <command> --help for exact CLI syntax; do not guess flags. Public commands are init, setup, update, upgrade, uninstall, mem, and doctor. They manage the harness and diagnostics, not coding-task stage transitions.

\`harnix init\` creates this project's .harnix state and root AGENTS bootstrap. It does not install platform integrations. \`harnix setup --kiro\`, \`harnix setup --antigravity\`, and \`harnix setup --codex\` are explicit user-global integration operations: they may run from any directory and affect only the selected user integration, not this repository. Do not run setup or harnix init automatically. Run a selected setup only with explicit user authorization; if a required global skill or hook is unavailable, report that instead of simulating it.

Activation guard and before work:

1. Locate the nearest initialized project ancestor or workspace root containing .harnix/config.yaml. If none exists or its state is invalid, do not apply Harnix workflow, read Harnix project state, create state, or run harnix init; report the problem.
2. Read .harnix/workflow.md and .harnix/config.yaml, verify the current repository evidence, then load only the context relevant to the request.
3. If .harnix/tasks/.active identifies an unfinished task, use harnix-continue and resume its persisted status, checkpoint, and evidence.
4. Otherwise classify the request as Bypass, Lite, or Full using .harnix/workflow.md. Read-only answers may bypass task creation; implementation work follows the selected workflow.

Use the skills in this order when their stage applies:

- harnix-brainstorm: establish scope, acceptance criteria, validation, and the ready gate.
- harnix-implement: implement a ready task; use RED-GREEN-REFACTOR for behavior changes unless a documented exception applies.
- harnix-check: run compliance checks before quality and security checks, using fresh evidence.
- harnix-finish-work: complete and archive only after every acceptance criterion and required check passes.
- harnix-research and harnix-debug: use only for material unknowns or failures; harnix-continue restores persisted work.

The persisted lifecycle is planning -> ready -> in_progress -> verifying -> completed. A blocked task resumes only to its recorded status. Do not skip gates or treat stale, partial, or inferred output as verification.

Operating rules:

- Preserve user-owned files, tasks, specs, research, journals, credentials, and unrelated configuration.
- Keep generated paths repository-relative and never expose secrets, prompts, or machine-specific absolute paths in output.
- Run harnix doctor --json when managed files, platform setup, or project state may have drifted.
- Require explicit user authorization for destructive, networked, installation, upgrade, purge, or externally visible actions.
- Never commit, branch, create a worktree, merge, push, publish, or create a pull request automatically.
- If the CLI, a required skill, or persisted state is unavailable or invalid, report the problem instead of inventing Harnix state or schemas.
<!-- harnix:end -->`;
}
